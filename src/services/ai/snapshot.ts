import { db } from '@/db/database';
import { computeStreak } from '@/features/habits/hooks';
import {
  buildWeeklyGoalReport,
  localDateKey,
  shiftLocalDateKey,
} from '@/features/goals/hooks';
import { getTimeContext } from '@/lib/timeContext';
import { formatCurrency } from '@/lib/utils';
import type { DataSnapshot, GoalBrief, HabitGap } from '@/services/ai/types';
import type { GoalDayLog } from '@/types';

function todayKey(d = new Date()) {
  return localDateKey(d);
}

function daysAgoKey(days: number) {
  return shiftLocalDateKey(todayKey(), -days);
}

async function loadGoalDayLogs(weekStart: string): Promise<GoalDayLog[]> {
  try {
    return await db.goalDayLogs.where('date').aboveOrEqual(weekStart).toArray();
  } catch {
    return [];
  }
}

/** Build a rich live snapshot of the operator's life data for the coach. */
export async function buildLifeSnapshot(now = new Date()): Promise<DataSnapshot> {
  const today = todayKey(now);
  const weekStart = daysAgoKey(6);
  const month = today.slice(0, 7);
  const day30 = daysAgoKey(29);
  const time = getTimeContext(now);

  const [
    habits,
    habitLogs,
    goals,
    goalDayLogs,
    tasks,
    prayerLogs,
    bibleReadings,
    prayerRequests,
    transactions,
    budgets,
    savingsGoals,
    healthMetrics,
    workouts,
    sessions,
    courses,
    books,
    assets,
    liabilities,
    gratitudeEntries,
    checkIns,
    businesses,
    wishlist,
    settings,
    profile,
  ] = await Promise.all([
    db.habits.filter((h) => !h.archived).toArray(),
    db.habitLogs.toArray(),
    db.goals.toArray(),
    loadGoalDayLogs(weekStart),
    db.tasks.toArray(),
    db.prayerLogs.toArray(),
    db.bibleReadings.toArray(),
    db.prayerRequests.toArray(),
    db.transactions.filter((t) => t.date.startsWith(month)).toArray(),
    db.budgets.toArray(),
    db.savingsGoals.toArray(),
    db.healthMetrics.where('date').aboveOrEqual(weekStart).toArray(),
    db.workouts.where('date').aboveOrEqual(day30).toArray(),
    db.learningSessions.where('date').aboveOrEqual(weekStart).toArray(),
    db.courses.toArray(),
    db.books.toArray(),
    db.assets.toArray(),
    db.liabilities.toArray(),
    db.gratitudeEntries.toArray(),
    db.dailyCheckIns.toArray(),
    db.businesses.toArray(),
    db.wishlist.toArray(),
    db.settings.get('app'),
    db.profiles.toCollection().first(),
  ]);

  let habitStreakMax = 0;
  const habitGaps: HabitGap[] = [];
  for (const habit of habits) {
    const streak = computeStreak(habit, habitLogs, today);
    habitStreakMax = Math.max(habitStreakMax, streak);
    const log = habitLogs.find(
      (l) => l.habitId === habit.id && l.date.slice(0, 10) === today,
    );
    const done = Boolean(log && log.count >= habit.targetPerDay);
    if (!done) {
      habitGaps.push({
        id: habit.id,
        name: habit.name,
        pillar: habit.pillar,
        streak,
      });
    }
  }

  const habitsCompletedToday = habits.length - habitGaps.length;

  const prayerDays = new Set(
    prayerLogs
      .filter((p) => p.date >= weekStart && (p.morning || p.evening))
      .map((p) => p.date.slice(0, 10)),
  );
  let prayerSkippedDaysLast7 = 0;
  for (let i = 0; i < 7; i++) {
    if (!prayerDays.has(daysAgoKey(i))) prayerSkippedDaysLast7 += 1;
  }

  const bibleDays = new Set(
    bibleReadings
      .filter((b) => b.date >= weekStart && b.completed)
      .map((b) => b.date.slice(0, 10)),
  );

  const spendingThisMonth = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const incomeThisMonth = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const monthlyBudgets = budgets.filter((b) => b.period === 'monthly');
  const budgetTotal = monthlyBudgets.reduce((s, b) => s + b.amount, 0);
  const budgetUtilizationPct =
    budgetTotal > 0 ? (spendingThisMonth / budgetTotal) * 100 : 0;

  const sleepSamples = healthMetrics
    .map((m) => m.sleepHours)
    .filter((h): h is number => typeof h === 'number');
  const avgSleepHoursLast7 =
    sleepSamples.length > 0
      ? sleepSamples.reduce((a, b) => a + b, 0) / sleepSamples.length
      : 0;

  const latestWeight = [...healthMetrics]
    .reverse()
    .find((m) => typeof m.weightKg === 'number')?.weightKg;

  const sleepTargetRaw = settings?.sleepTarget ?? '21:30';
  const wakeRaw = settings?.wakeTime ?? '04:30';
  let sleepTargetHours = 7.5;
  try {
    const [wh, wm] = wakeRaw.split(':').map(Number);
    const [sh, sm] = sleepTargetRaw.split(':').map(Number);
    const wakeMins = (wh ?? 4) * 60 + (wm ?? 30);
    const sleepMins = (sh ?? 21) * 60 + (sm ?? 30);
    sleepTargetHours =
      (((wakeMins + 24 * 60 - sleepMins) % (24 * 60)) / 60) || 7.5;
  } catch {
    sleepTargetHours = 7.5;
  }

  const studyHoursLast7 =
    sessions.reduce((s, x) => s + x.durationMinutes, 0) / 60;

  const netWorth =
    assets.reduce((s, a) => s + a.value, 0) -
    liabilities.reduce((s, l) => s + l.balance, 0);

  const gSet = new Set(gratitudeEntries.map((g) => g.date.slice(0, 10)));
  let gratitudeStreak = 0;
  let gCursor = today;
  if (!gSet.has(gCursor)) gCursor = daysAgoKey(1);
  for (let i = 0; i < 400; i++) {
    if (!gSet.has(gCursor)) break;
    gratitudeStreak += 1;
    const d = new Date(`${gCursor}T12:00:00`);
    d.setDate(d.getDate() - 1);
    gCursor = d.toISOString().slice(0, 10);
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const weekReport = buildWeeklyGoalReport(goals, goalDayLogs, now);
  const goalBriefs: GoalBrief[] = activeGoals
    .map((g) => {
      const gLogs = goalDayLogs.filter((l) => l.goalId === g.id);
      return {
        id: g.id,
        title: g.title,
        progress: g.progress,
        pillar: g.pillar,
        targetDate: g.targetDate,
        openMilestones: g.milestones.filter((m) => !m.completed).length,
        workedToday: gLogs.some((l) => l.date === today && l.worked),
        weekDaysWorked: new Set(
          gLogs.filter((l) => l.worked && l.date >= weekStart).map((l) => l.date),
        ).size,
        weekDelta: gLogs
          .filter((l) => l.date >= weekStart)
          .reduce((s, l) => s + Math.max(0, l.delta), 0),
      };
    })
    .sort((a, b) => a.progress - b.progress);

  const openTasks = tasks.filter(
    (t) => t.status === 'todo' || t.status === 'in_progress',
  );
  const overdueTasks = openTasks.filter((t) => {
    if (!t.dueDate) return false;
    return t.dueDate.slice(0, 10) < today;
  });
  const tasksDoneToday = tasks.filter(
    (t) => t.status === 'done' && t.completedAt?.startsWith(today),
  ).length;

  const topSavings = [...savingsGoals].sort(
    (a, b) =>
      (b.currentAmount / Math.max(b.targetAmount, 1)) -
      (a.currentAmount / Math.max(a.targetAmount, 1)),
  )[0];

  const recentCheckIn = [...checkIns].sort((a, b) =>
    b.date.localeCompare(a.date),
  )[0];

  const readingBooks = books.filter((b) => b.status === 'reading').length;
  const activeCourses = courses.filter((c) => c.status === 'in_progress').length;

  const openPrayerRequests = prayerRequests.filter((p) => !p.answered).length;
  const activeBusinesses = businesses.filter(
    (b) => b.status === 'active' || b.status === 'new',
  ).length;

  const wishlistTop = [...wishlist]
    .filter((w) => w.status !== 'purchased' && w.status !== 'dropped')
    .sort((a, b) => {
      const ap = (a.savedAmount ?? 0) / Math.max(a.estimatedCost ?? 1, 1);
      const bp = (b.savedAmount ?? 0) / Math.max(b.estimatedCost ?? 1, 1);
      return bp - ap;
    })[0];

  const currency = settings?.currency ?? 'KES';

  return {
    displayName: profile?.displayName?.split(/\s+/)[0] ?? 'Operator',
    timeLabel: time.label,
    greeting: time.greeting,
    slot: time.slot,
    weekday: time.weekday,
    currency,
    habitStreakMax,
    habitsCompletedToday,
    habitsTargetToday: habits.length,
    habitGaps: habitGaps.slice(0, 8),
    prayerSkippedDaysLast7,
    prayersLoggedLast7: prayerDays.size,
    bibleDaysLast7: bibleDays.size,
    openPrayerRequests,
    spendingThisMonth,
    incomeThisMonth,
    budgetUtilizationPct,
    spendingLabel: formatCurrency(spendingThisMonth, currency),
    incomeLabel: formatCurrency(incomeThisMonth, currency),
    netWorth,
    netWorthLabel: formatCurrency(netWorth, currency),
    netWorthDelta30d: 0,
    topSavingsName: topSavings?.name,
    topSavingsPct: topSavings
      ? Math.round(
          (topSavings.currentAmount / Math.max(topSavings.targetAmount, 1)) *
            100,
        )
      : undefined,
    avgSleepHoursLast7,
    sleepTargetHours,
    latestWeightKg: latestWeight,
    workoutsLast30: workouts.length,
    studyHoursLast7,
    activeCourses,
    readingBooks,
    gratitudeStreak,
    gratitudeToday: gSet.has(today),
    goals: goalBriefs,
    goalsCompleted: goals.filter((g) => g.status === 'completed').length,
    goalWeek: {
      daysWorked: weekReport.daysWorked,
      goalsTouched: weekReport.goalsTouched,
      netProgressThisWeek: weekReport.netProgressThisWeek,
      avgProgressNow: weekReport.avgProgressNow,
      momentum: weekReport.momentum,
      headline: weekReport.headline,
      coachingLine: weekReport.coachingLine,
    },
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length,
    tasksDoneToday,
    recentMood: recentCheckIn?.mood,
    recentEnergy: recentCheckIn?.energy,
    recentFocus: recentCheckIn?.focus,
    checkInToday: Boolean(
      checkIns.find((c) => c.date.slice(0, 10) === today),
    ),
    activeBusinesses,
    wishlistTopTitle: wishlistTop?.title,
    wishlistTopPct: wishlistTop?.estimatedCost
      ? Math.round(
          ((wishlistTop.savedAmount ?? 0) / wishlistTop.estimatedCost) * 100,
        )
      : undefined,
  };
}
