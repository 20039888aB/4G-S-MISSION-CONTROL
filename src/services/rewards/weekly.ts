import { db } from '@/db/database';
import { percent, uid } from '@/lib/utils';

export type WeeklyRewardSuggestion = {
  title: string;
  reason: string;
  budgetHint: string;
  score: number;
  earned: boolean;
};

const REWARDS = [
  { title: 'Coffee treat', budgetHint: 'KES 300–500' },
  { title: 'Movie night', budgetHint: 'KES 800–1,500' },
  { title: 'Nice dinner', budgetHint: 'KES 1,500–3,000' },
  { title: 'New shoes contribution', budgetHint: 'KES 1,000+' },
  { title: 'Small gadget fund', budgetHint: 'KES 2,000+' },
];

function weekRange(now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return {
    startKey: start.toISOString().slice(0, 10),
    endKey: end.toISOString().slice(0, 10),
  };
}

/** Analyze the last 7 days and suggest a modest reward if performance is strong. */
export async function evaluateWeeklyReward(
  now = new Date(),
): Promise<WeeklyRewardSuggestion> {
  const { startKey, endKey } = weekRange(now);
  const [habits, habitLogs, workouts, prayerLogs, gratitude] = await Promise.all([
    db.habits.filter((h) => !h.archived).toArray(),
    db.habitLogs.where('date').between(startKey, endKey, true, true).toArray(),
    db.workouts.where('date').between(startKey, endKey, true, true).toArray(),
    db.prayerLogs.where('date').between(startKey, endKey, true, true).toArray(),
    db.gratitudeEntries.where('date').between(startKey, endKey, true, true).toArray(),
  ]);

  const habitDays = new Set(habitLogs.map((l) => l.date.slice(0, 10))).size;
  const habitScore = habits.length
    ? percent(habitLogs.length, habits.length * 7)
    : 50;
  const workoutScore = Math.min(100, workouts.length * 20);
  const prayerScore = Math.min(100, prayerLogs.length * 15);
  const gratitudeScore = Math.min(100, gratitude.length * 15);
  const consistencyBonus = habitDays >= 5 ? 10 : 0;

  const score = Math.round(
    clampAvg([habitScore, workoutScore, prayerScore, gratitudeScore]) +
      consistencyBonus,
  );
  const earned = score >= 70;
  const reward = REWARDS[Math.min(REWARDS.length - 1, Math.floor(score / 25))];

  return {
    title: earned ? reward.title : 'Keep grinding',
    reason: earned
      ? `You scored ${score}/100 this week — consistency deserves a small celebration within budget.`
      : `Weekly score ${score}/100. Close a few more loops, then treat yourself next Sunday.`,
    budgetHint: earned ? reward.budgetHint : 'No reward yet — protect the budget.',
    score: Math.min(100, score),
    earned,
  };
}

function clampAvg(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Persist a weekly review notification once per Sunday evening window. */
export async function maybeNotifyWeeklyReview(): Promise<void> {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 18) return;

  const key = `weekly-review-${now.toISOString().slice(0, 10)}`;
  const existing = await db.notifications.where('id').equals(key).first();
  if (existing) return;

  const result = await evaluateWeeklyReward(now);
  await db.notifications.add({
    id: key,
    title: result.earned ? 'Weekly reward unlocked' : 'Weekly review ready',
    body: `${result.reason} Suggestion: ${result.title} (${result.budgetHint})`,
    type: result.earned ? 'achievement' : 'reminder',
    read: false,
    createdAt: now.toISOString(),
  });

  await db.activityLogs.add({
    id: uid(),
    entity: 'system',
    action: 'weekly_review',
    summary: `Weekly review score ${result.score}`,
    createdAt: now.toISOString(),
  });
}
