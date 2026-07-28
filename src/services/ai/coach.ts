import type {
  CoachAction,
  DataSnapshot,
  Insight,
  InsightSeverity,
} from '@/services/ai/types';
import { buildInsightSpeech, pickWisdom } from '@/services/ai/wisdom';
import type { G4Pillar } from '@/types';

export type {
  CoachAction,
  CoachIntent,
  CoachMessage,
  CoachReply,
  DataSnapshot,
  HabitGap,
  Insight,
  InsightSeverity,
} from '@/services/ai/types';

function insight(
  id: string,
  category: string,
  severity: InsightSeverity,
  message: string,
  relatedPillar: G4Pillar,
  advice?: string,
  actions?: CoachAction[],
  seed = 0,
): Insight {
  const pack = pickWisdom(category, seed || id.length * 17 + message.length);
  const mergedAdvice = advice ?? pack.motivation;
  return {
    id,
    category,
    severity,
    message,
    relatedPillar,
    quote: pack.quote,
    quoteAuthor: pack.author,
    wisdom: pack.wisdom,
    advice: mergedAdvice,
    motivation: pack.motivation,
    speakText: buildInsightSpeech({
      title: `${category} insight`,
      message,
      quote: pack.quote,
      author: pack.author,
      wisdom: pack.wisdom,
      advice: mergedAdvice,
      motivation: pack.motivation,
    }),
    actions,
  };
}

function scoreLife(s: DataSnapshot): number {
  const habitRate =
    s.habitsTargetToday > 0
      ? s.habitsCompletedToday / s.habitsTargetToday
      : 0.5;
  const prayerScore = Math.max(0, 1 - s.prayerSkippedDaysLast7 / 7);
  const gratitudeScore = Math.min(1, s.gratitudeStreak / 7);
  const goalScore =
    s.goals.length > 0
      ? s.goals.reduce((a, g) => a + g.progress, 0) / (s.goals.length * 100)
      : 0.4;
  const healthScore =
    s.avgSleepHoursLast7 > 0
      ? Math.min(
          1,
          s.avgSleepHoursLast7 / Math.max(s.sleepTargetHours, 6),
        )
      : 0.5;
  const moneyScore =
    s.incomeThisMonth > 0
      ? Math.min(1, Math.max(0, 1 - s.spendingThisMonth / s.incomeThisMonth))
      : 0.5;
  return Math.round(
    (habitRate * 0.25 +
      prayerScore * 0.15 +
      gratitudeScore * 0.1 +
      goalScore * 0.2 +
      healthScore * 0.15 +
      moneyScore * 0.15) *
      100,
  );
}

/** Deep, motivational, progress-aware insights — never shame. */
export function generateInsights(snapshot: DataSnapshot): Insight[] {
  const insights: Insight[] = [];
  const lifeScore = scoreLife(snapshot);

  insights.push(
    insight(
      'life-score',
      'best-self',
      lifeScore >= 70 ? 'success' : lifeScore >= 45 ? 'info' : 'warning',
      `Your Best-Self Score is ${lifeScore}/100 right now (${snapshot.timeLabel}).`,
      'goals',
      lifeScore >= 70
        ? 'Protect the systems that got you here — consistency over intensity.'
        : 'Pick one lever today: one habit, one prayer, or one milestone. Momentum loves a single win.',
      [{ label: 'Daily Review', href: '/review' }],
    ),
  );

  if (snapshot.habitStreakMax >= 7) {
    insights.push(
      insight(
        'streak-strong',
        'habits',
        'success',
        `Your ${snapshot.habitStreakMax}-day streak is identity in motion.`,
        'grinding',
        'Guard the chain tonight: prepare clothes, water, and your first habit before sleep.',
        [{ label: 'Open Habits', href: '/habits' }],
      ),
    );
  } else if (snapshot.habitGaps[0]) {
    const gap = snapshot.habitGaps[0];
    insights.push(
      insight(
        'habit-gap',
        'habits',
        'warning',
        `${snapshot.habitsCompletedToday}/${snapshot.habitsTargetToday} habits done. Next unlock: “${gap.name}”.`,
        gap.pillar ?? 'grinding',
        'Do the smallest version in the next 10 minutes. Done beats perfect.',
        [{ label: 'Complete habits', href: '/habits' }],
      ),
    );
  }

  if (snapshot.goals[0]) {
    const g = snapshot.goals[0];
    insights.push(
      insight(
        'goal-focus',
        'goals',
        g.progress < 30 ? 'warning' : 'info',
        `Priority goal “${g.title}” is at ${g.progress}%${g.openMilestones ? ` with ${g.openMilestones} open milestones` : ''}.`,
        g.pillar ?? 'goals',
        g.progress < 30
          ? 'Break one milestone into a 25-minute task and schedule it today.'
          : 'Keep shipping weekly proof. Progress compounds when milestones close.',
        [
          { label: 'Open Goals', href: '/goals' },
          { label: 'Add linked task', href: '/tasks' },
        ],
      ),
    );
  } else {
    insights.push(
      insight(
        'goal-missing',
        'goals',
        'info',
        'No active goals yet — vision needs a target.',
        'goals',
        'Write one 90-day goal tied to income, health, or faith. Clarity creates energy.',
        [{ label: 'Create a goal', href: '/goals' }],
      ),
    );
  }

  if (snapshot.goalWeek.daysWorked === 0 && snapshot.goals.length > 0) {
    insights.push(
      insight(
        'goal-week-quiet',
        'goals',
        'warning',
        'No goal work logged this week yet — days are the real scoreboard.',
        'goals',
        snapshot.goalWeek.coachingLine,
        [{ label: 'Log goal work', href: '/goals' }],
      ),
    );
  } else if (snapshot.goalWeek.daysWorked >= 4) {
    insights.push(
      insight(
        'goal-week-strong',
        'goals',
        'success',
        snapshot.goalWeek.headline,
        'goals',
        snapshot.goalWeek.coachingLine,
        [{ label: 'See weekly pulse', href: '/goals' }],
      ),
    );
  }

  if (snapshot.overdueTasks > 0) {
    insights.push(
      insight(
        'tasks-overdue',
        'tasks',
        'warning',
        `You have ${snapshot.overdueTasks} overdue task${snapshot.overdueTasks === 1 ? '' : 's'}.`,
        'grinding',
        'Clear one overdue item now — unfinished loops drain focus more than hard work.',
        [{ label: 'Open Tasks', href: '/tasks' }],
      ),
    );
  } else if (snapshot.openTasks > 5) {
    insights.push(
      insight(
        'tasks-load',
        'tasks',
        'info',
        `${snapshot.openTasks} open tasks. High load can hide the vital few.`,
        'grinding',
        'Pick the single highest-leverage task for this day-part and ignore the rest for 25 minutes.',
        [{ label: 'Focus tasks', href: '/tasks' }],
      ),
    );
  }

  if (snapshot.prayerSkippedDaysLast7 >= 3) {
    insights.push(
      insight(
        'prayer-reconnect',
        'spiritual',
        'info',
        'Prayer rhythm has gaps this week — reconnect without guilt.',
        'god',
        'Start with 5 honest minutes. God meets consistency more than performance.',
        [{ label: 'Spiritual', href: '/spiritual' }],
      ),
    );
  } else if (snapshot.prayersLoggedLast7 >= 5) {
    insights.push(
      insight(
        'prayer-steady',
        'spiritual',
        'success',
        `${snapshot.prayersLoggedLast7} prayer days this week are anchoring your grind.`,
        'god',
        'Keep the morning lock-in. Pair prayer with your first habit.',
        [{ label: 'Log prayer', href: '/spiritual' }],
      ),
    );
  }

  if (snapshot.bibleDaysLast7 < 3) {
    insights.push(
      insight(
        'bible-invite',
        'spiritual',
        'info',
        `Bible reading logged ${snapshot.bibleDaysLast7}/7 days.`,
        'god',
        'One chapter is enough to re-center. Truth before timelines.',
        [{ label: 'Bible tracker', href: '/spiritual' }],
      ),
    );
  }

  if (snapshot.budgetUtilizationPct >= 90) {
    insights.push(
      insight(
        'spend-tight',
        'finance',
        'warning',
        `Budget is ~${Math.round(snapshot.budgetUtilizationPct)}% used (${snapshot.spendingLabel} spent).`,
        'goals',
        'Pause non-essentials for 48 hours. Redirect any surplus to savings.',
        [{ label: 'Finance', href: '/finance' }],
      ),
    );
  } else if (
    snapshot.incomeThisMonth > 0 &&
    snapshot.spendingThisMonth < snapshot.incomeThisMonth * 0.7
  ) {
    insights.push(
      insight(
        'spend-healthy',
        'finance',
        'success',
        `Healthy gap: income ${snapshot.incomeLabel} vs spend ${snapshot.spendingLabel}.`,
        'goals',
        snapshot.topSavingsName
          ? `Push surplus into “${snapshot.topSavingsName}” (${snapshot.topSavingsPct ?? 0}%).`
          : 'Create a named savings goal so surplus has a mission.',
        [{ label: 'Savings', href: '/finance' }],
      ),
    );
  }

  if (snapshot.avgSleepHoursLast7 > 0) {
    const delta = snapshot.avgSleepHoursLast7 - snapshot.sleepTargetHours;
    if (delta < -0.75) {
      insights.push(
        insight(
          'sleep-short',
          'health',
          'warning',
          `Sleep averaging ${snapshot.avgSleepHoursLast7.toFixed(1)}h vs ~${snapshot.sleepTargetHours.toFixed(1)}h target.`,
          'grinding',
          'Protect wind-down: phone away 30 minutes before bed. Recovery is strategy.',
          [{ label: 'Health log', href: '/health' }],
        ),
      );
    } else {
      insights.push(
        insight(
          'sleep-good',
          'health',
          'success',
          'Sleep is supporting your mission.',
          'grinding',
          'Keep the same bedtime ritual — boring sleep is elite performance.',
        ),
      );
    }
  }

  if (snapshot.workoutsLast30 < 4) {
    insights.push(
      insight(
        'workouts-nudge',
        'fitness',
        'info',
        `Only ${snapshot.workoutsLast30} workouts in 30 days.`,
        'grinding',
        'Book one 20-minute session. A short walk counts if it is intentional.',
        [{ label: 'Log workout', href: '/health' }],
      ),
    );
  } else if (snapshot.workoutsLast30 >= 12) {
    insights.push(
      insight(
        'workouts-strong',
        'fitness',
        'success',
        `${snapshot.workoutsLast30} workouts in 30 days — body and mind aligned.`,
        'grinding',
        'Progressive overload in life: add 5 minutes or one harder set this week.',
      ),
    );
  }

  if (snapshot.studyHoursLast7 < 2 && snapshot.activeCourses + snapshot.readingBooks > 0) {
    insights.push(
      insight(
        'study-spark',
        'learning',
        'warning',
        `Learning assets are open, but only ${snapshot.studyHoursLast7.toFixed(1)}h studied this week.`,
        'goals',
        'Schedule a 45-minute deep block after your strongest habit.',
        [{ label: 'Learning', href: '/learning' }],
      ),
    );
  } else if (snapshot.studyHoursLast7 >= 5) {
    insights.push(
      insight(
        'study-deep',
        'learning',
        'success',
        `${snapshot.studyHoursLast7.toFixed(1)} study hours this week — mastery path is active.`,
        'goals',
        'Teach one concept you learned. Teaching seals ownership.',
      ),
    );
  }

  if (!snapshot.gratitudeToday) {
    insights.push(
      insight(
        'gratitude-today',
        'gratitude',
        'info',
        'No gratitude entry yet today.',
        'gratitude',
        'Write three specific blessings. Specificity trains joy.',
        [{ label: 'Gratitude journal', href: '/gratitude' }],
      ),
    );
  } else if (snapshot.gratitudeStreak >= 3) {
    insights.push(
      insight(
        'gratitude-flow',
        'gratitude',
        'success',
        `${snapshot.gratitudeStreak}-day gratitude streak — abundance mindset is training.`,
        'gratitude',
        'Add one person you can encourage today. Gratitude grows when shared.',
      ),
    );
  }

  if (!snapshot.checkInToday && (snapshot.slot === 'evening' || snapshot.slot === 'night')) {
    insights.push(
      insight(
        'review-due',
        'review',
        'warning',
        'Evening window is open — close the loop with a Daily Review.',
        'goals',
        'Capture wins, blockers, and tomorrow’s #1 priority before sleep.',
        [{ label: 'Daily Review', href: '/review' }],
      ),
    );
  }

  if (
    typeof snapshot.recentEnergy === 'number' &&
    snapshot.recentEnergy <= 4
  ) {
    insights.push(
      insight(
        'energy-low',
        'mindset',
        'info',
        `Recent energy logged at ${snapshot.recentEnergy}/10.`,
        'grinding',
        'Shrink the plan: hydration, 10-minute walk, one must-win task. Rest is not quitting.',
        [{ label: 'Daily Review', href: '/review' }],
      ),
    );
  }

  if (snapshot.activeBusinesses > 0) {
    insights.push(
      insight(
        'business-pulse',
        'business',
        'info',
        `${snapshot.activeBusinesses} active business${snapshot.activeBusinesses === 1 ? '' : 'es'} on the board.`,
        'goals',
        'Ship one client touchpoint or revenue action today — businesses die from silence.',
        [{ label: 'Business hub', href: '/business' }],
      ),
    );
  }

  const priority = { warning: 0, info: 1, success: 2 } as const;
  return insights
    .sort((a, b) => priority[a.severity] - priority[b.severity])
    .slice(0, 10);
}

export function buildDailyMissionPlan(snapshot: DataSnapshot): string[] {
  const plan: string[] = [];
  if (snapshot.habitGaps[0]) {
    plan.push(`Complete habit: ${snapshot.habitGaps[0].name}`);
  }
  if (snapshot.prayerSkippedDaysLast7 > 0 || snapshot.prayersLoggedLast7 < 5) {
    plan.push('Pray for 5–10 focused minutes');
  }
  if (!snapshot.gratitudeToday) {
    plan.push('Log 3 gratitudes');
  }
  if (snapshot.goals[0]) {
    plan.push(
      `Advance “${snapshot.goals[0].title}” by one milestone or 25 focused minutes`,
    );
  }
  if (snapshot.overdueTasks > 0) {
    plan.push('Clear 1 overdue task');
  } else if (snapshot.openTasks > 0) {
    plan.push('Finish your top-priority open task');
  }
  if (snapshot.workoutsLast30 < 8) {
    plan.push('Move your body for at least 20 minutes');
  }
  if (snapshot.slot === 'evening' || snapshot.slot === 'night') {
    plan.push('Complete Daily Review before sleep');
  }
  return plan.slice(0, 5);
}

export { scoreLife };
