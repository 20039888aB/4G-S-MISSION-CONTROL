import type { G4Database } from '@/db/database';
import { uid } from '@/lib/utils';
import type { Achievement, UnlockedAchievement } from '@/types';

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(b) - Date.parse(a);
  return Math.round(ms / 86_400_000);
}

async function maxHabitStreak(database: G4Database): Promise<number> {
  const habits = await database.habits.filter((h) => !h.archived).toArray();
  const logs = await database.habitLogs.toArray();
  let best = 0;

  for (const habit of habits) {
    const dates = [
      ...new Set(
        logs
          .filter((log) => log.habitId === habit.id && log.count > 0)
          .map((log) => log.date.slice(0, 10))
          .sort(),
      ),
    ];

    let streak = 0;
    let prev: string | null = null;
    for (const date of dates) {
      if (prev && daysBetween(prev, date) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      best = Math.max(best, streak);
      prev = date;
    }
  }

  return best;
}

async function wakeEarlyStreak(database: G4Database): Promise<number> {
  const wakeHabit = await database.habits
    .filter((h) => h.name.toLowerCase().includes('wake'))
    .first();
  if (!wakeHabit) return 0;

  const dates = [
    ...new Set(
      (await database.habitLogs.where('habitId').equals(wakeHabit.id).toArray())
        .filter((log) => log.count > 0)
        .map((log) => log.date.slice(0, 10))
        .sort(),
    ),
  ];

  let best = 0;
  let streak = 0;
  let prev: string | null = null;
  for (const date of dates) {
    if (prev && daysBetween(prev, date) === 1) streak += 1;
    else streak = 1;
    best = Math.max(best, streak);
    prev = date;
  }
  return best;
}

async function progressFor(
  database: G4Database,
  achievement: Achievement,
): Promise<number> {
  switch (achievement.key) {
    case 'streak_7':
    case 'streak_30':
      return maxHabitStreak(database);
    case 'wake_early_14':
      return wakeEarlyStreak(database);
    case 'workouts_100':
      return database.workouts.count();
    case 'prayers_100': {
      const logs = await database.prayerLogs.toArray();
      return logs.reduce(
        (sum, log) => sum + Number(log.morning) + Number(log.evening),
        0,
      );
    }
    case 'saved_100k': {
      const goals = await database.savingsGoals.toArray();
      return goals.reduce((sum, g) => sum + g.currentAmount, 0);
    }
    case 'first_course':
      return database.courses.filter((c) => c.status === 'completed').count();
    case 'lose_5kg': {
      const measures = await database.bodyMeasurements
        .orderBy('date')
        .toArray();
      const withWeight = measures.filter((m) => typeof m.weightKg === 'number');
      if (withWeight.length < 2) return 0;
      const first = withWeight[0]!.weightKg!;
      const last = withWeight[withWeight.length - 1]!.weightKg!;
      return Math.max(0, first - last);
    }
    case 'gratitude_30':
      return database.gratitudeEntries.count();
    case 'bible_21':
      return database.bibleReadings.filter((r) => r.completed).count();
    case 'tasks_50':
      return database.tasks.filter((t) => t.status === 'done').count();
    case 'first_invoice':
      return database.invoices.filter((i) => i.status === 'paid').count();
    case 'study_50h': {
      const sessions = await database.learningSessions.toArray();
      const minutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      return minutes / 60;
    }
    case 'net_worth_positive': {
      const [assets, liabilities] = await Promise.all([
        database.assets.toArray(),
        database.liabilities.toArray(),
      ]);
      const net =
        assets.reduce((s, a) => s + a.value, 0) -
        liabilities.reduce((s, l) => s + l.balance, 0);
      return net > 0 ? 1 : 0;
    }
    default:
      return 0;
  }
}

export async function evaluateAchievements(
  database: G4Database,
): Promise<UnlockedAchievement[]> {
  const [definitions, unlocked] = await Promise.all([
    database.achievements.toArray(),
    database.unlockedAchievements.toArray(),
  ]);

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const newlyUnlocked: UnlockedAchievement[] = [];
  const now = new Date().toISOString();

  for (const achievement of definitions) {
    if (unlockedIds.has(achievement.id)) continue;

    const progress = await progressFor(database, achievement);
    if (progress >= achievement.threshold) {
      const record: UnlockedAchievement = {
        id: uid(),
        achievementId: achievement.id,
        unlockedAt: now,
        seen: false,
      };
      newlyUnlocked.push(record);
    }
  }

  if (newlyUnlocked.length > 0) {
    await database.unlockedAchievements.bulkAdd(newlyUnlocked);

    await database.notifications.bulkAdd(
      newlyUnlocked.map((item) => {
        const def = definitions.find((d) => d.id === item.achievementId);
        return {
          id: uid(),
          type: 'achievement' as const,
          title: 'Achievement unlocked',
          body: def
            ? `${def.title} — ${def.description}`
            : 'You unlocked a new badge.',
          read: false,
          relatedId: item.achievementId,
          createdAt: now,
        };
      }),
    );
  }

  return newlyUnlocked;
}
