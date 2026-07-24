import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { clamp, percent } from '@/lib/utils';

export interface MissionScores {
  mission: number;
  health: number;
  finance: number;
  discipline: number;
  learning: number;
  business: number;
  spiritual: number;
  overall: number;
  loading: boolean;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function scoreFromRate(completed: number, total: number): number {
  if (total <= 0) return 50;
  return clamp(percent(completed, total), 0, 100);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function useMissionScores(): MissionScores {
  const scores = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10);
    const d7 = isoDaysAgo(7);
    const d30 = isoDaysAgo(30);

    const [
      habits,
      habitLogs,
      workouts,
      healthMetrics,
      transactions,
      assets,
      liabilities,
      savingsGoals,
      courses,
      learningSessions,
      prayerLogs,
      bibleReadings,
      gratitudeEntries,
      businesses,
      invoices,
      tasks,
    ] = await Promise.all([
      db.habits.filter((h) => !h.archived).toArray(),
      db.habitLogs.where('date').aboveOrEqual(d7).toArray(),
      db.workouts.where('date').aboveOrEqual(d30).toArray(),
      db.healthMetrics.where('date').aboveOrEqual(d7).toArray(),
      db.transactions.where('date').aboveOrEqual(d30).toArray(),
      db.assets.toArray(),
      db.liabilities.toArray(),
      db.savingsGoals.toArray(),
      db.courses.toArray(),
      db.learningSessions.where('date').aboveOrEqual(d7).toArray(),
      db.prayerLogs.where('date').aboveOrEqual(d7).toArray(),
      db.bibleReadings.where('date').aboveOrEqual(d7).toArray(),
      db.gratitudeEntries.where('date').aboveOrEqual(d7).toArray(),
      db.businesses.toArray(),
      db.invoices.toArray(),
      db.tasks.toArray(),
    ]);

    const todayLogs = habitLogs.filter((l) => l.date.startsWith(today));
    const habitsDone = habits.filter((h) =>
      todayLogs.some((l) => l.habitId === h.id && l.count >= h.targetPerDay),
    ).length;
    const discipline = scoreFromRate(habitsDone, Math.max(habits.length, 1));

    const workoutScore = clamp((workouts.length / 12) * 100, 0, 100);
    const sleepVals = healthMetrics
      .map((m) => m.sleepHours)
      .filter((v): v is number => typeof v === 'number');
    const sleepScore =
      sleepVals.length === 0
        ? 50
        : clamp(100 - Math.abs(avg(sleepVals) - 7.5) * 18, 0, 100);
    const waterVals = healthMetrics
      .map((m) => m.waterMl)
      .filter((v): v is number => typeof v === 'number');
    const waterScore =
      waterVals.length === 0
        ? 50
        : clamp((avg(waterVals) / 2500) * 100, 0, 100);
    const health = Math.round(avg([workoutScore, sleepScore, waterScore]));

    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const cashflowScore =
      income <= 0 ? (expense === 0 ? 50 : 35) : clamp(((income - expense) / income) * 100 + 50, 0, 100);
    const assetTotal = assets.reduce((s, a) => s + a.value, 0);
    const liabilityTotal = liabilities.reduce((s, l) => s + l.balance, 0);
    const net = assetTotal - liabilityTotal;
    const netScore =
      assetTotal + liabilityTotal === 0
        ? 50
        : clamp(((net + liabilityTotal) / (assetTotal + liabilityTotal)) * 100, 0, 100);
    const savingsRate =
      savingsGoals.length === 0
        ? 50
        : avg(
            savingsGoals.map((g) =>
              g.targetAmount > 0
                ? clamp((g.currentAmount / g.targetAmount) * 100, 0, 100)
                : 0,
            ),
          );
    const finance = Math.round(avg([cashflowScore, netScore, savingsRate]));

    const studyMinutes = learningSessions.reduce(
      (s, x) => s + x.durationMinutes,
      0,
    );
    const studyScore = clamp((studyMinutes / 60 / 7) * 100, 0, 100);
    const courseScore =
      courses.length === 0
        ? 50
        : avg(courses.map((c) => clamp(c.progress, 0, 100)));
    const learning = Math.round(avg([studyScore, courseScore]));

    const paidInvoices = invoices.filter((i) => i.status === 'paid').length;
    const invoiceScore =
      invoices.length === 0
        ? businesses.length > 0
          ? 55
          : 45
        : scoreFromRate(paidInvoices, invoices.length);
    const businessPresence = businesses.length > 0 ? 70 : 40;
    const business = Math.round(avg([invoiceScore, businessPresence]));

    const prayerDays = new Set(
      prayerLogs
        .filter((p) => p.morning || p.evening)
        .map((p) => p.date.slice(0, 10)),
    ).size;
    const bibleDone = bibleReadings.filter((b) => b.completed).length;
    const gratitudeDays = new Set(
      gratitudeEntries.map((g) => g.date.slice(0, 10)),
    ).size;
    const spiritual = Math.round(
      avg([
        scoreFromRate(prayerDays, 7),
        clamp((bibleDone / 7) * 100, 0, 100),
        clamp((gratitudeDays / 7) * 100, 0, 100),
      ]),
    );

    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const taskScore = scoreFromRate(doneTasks, Math.max(tasks.length, 1));
    const mission = Math.round(
      avg([discipline, health, finance, learning, business, spiritual, taskScore]),
    );

    const overall = Math.round(
      avg([mission, health, finance, discipline, learning, business, spiritual]),
    );

    return {
      mission,
      health,
      finance,
      discipline,
      learning,
      business,
      spiritual,
      overall,
    };
  }, []);

  if (!scores) {
    return {
      mission: 0,
      health: 0,
      finance: 0,
      discipline: 0,
      learning: 0,
      business: 0,
      spiritual: 0,
      overall: 0,
      loading: true,
    };
  }

  return { ...scores, loading: false };
}
