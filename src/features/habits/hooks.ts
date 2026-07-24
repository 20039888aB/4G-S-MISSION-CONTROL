import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { percent, uid } from '@/lib/utils';
import type { Habit, HabitFrequency, HabitLog, G4Pillar } from '@/types';

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function daysAgoKey(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function lastNDateKeys(n: number, from = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => daysAgoKey(n - 1 - i, from));
}

export function isHabitDone(habit: Habit, log?: HabitLog | null): boolean {
  if (!log) return false;
  return log.count >= habit.targetPerDay;
}

/** Consecutive completed days ending at `endDate` (inclusive if done that day). */
export function computeStreak(
  habit: Habit,
  logs: HabitLog[],
  endDate = todayKey(),
): number {
  const byDate = new Map(
    logs
      .filter((l) => l.habitId === habit.id)
      .map((l) => [l.date.slice(0, 10), l] as const),
  );

  let cursor = endDate;
  const todayLog = byDate.get(cursor);
  if (!isHabitDone(habit, todayLog)) {
    cursor = daysAgoKey(1, new Date(`${endDate}T12:00:00`));
  }

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const log = byDate.get(cursor);
    if (!isHabitDone(habit, log)) break;
    streak += 1;
    cursor = daysAgoKey(1, new Date(`${cursor}T12:00:00`));
  }
  return streak;
}

export interface HabitWithMeta extends Habit {
  todayLog?: HabitLog;
  doneToday: boolean;
  streak: number;
  week: { date: string; done: boolean; count: number }[];
}

export function useHabitsLive() {
  return useLiveQuery(async () => {
    const today = todayKey();
    const weekStart = daysAgoKey(6);
    const [habits, logs] = await Promise.all([
      db.habits.orderBy('sortOrder').toArray(),
      db.habitLogs.where('date').aboveOrEqual(weekStart).toArray(),
    ]);

    const active = habits.filter((h) => !h.archived);
    const weekKeys = lastNDateKeys(7);

    const withMeta: HabitWithMeta[] = active.map((habit) => {
      const habitLogs = logs.filter((l) => l.habitId === habit.id);
      const todayLog = habitLogs.find((l) => l.date.slice(0, 10) === today);
      const week = weekKeys.map((date) => {
        const log = habitLogs.find((l) => l.date.slice(0, 10) === date);
        return {
          date,
          count: log?.count ?? 0,
          done: isHabitDone(habit, log),
        };
      });
      return {
        ...habit,
        todayLog,
        doneToday: isHabitDone(habit, todayLog),
        streak: computeStreak(habit, habitLogs, today),
        week,
      };
    });

    const doneCount = withMeta.filter((h) => h.doneToday).length;
    const completionPct = percent(doneCount, Math.max(withMeta.length, 1));

    return {
      habits: withMeta,
      doneCount,
      total: withMeta.length,
      completionPct,
      today,
    };
  }, []);
}

export type HabitInput = {
  name: string;
  description?: string;
  icon?: string;
  pillar?: G4Pillar;
  color?: string;
  frequency: HabitFrequency;
  targetPerDay?: number;
  reminderTime?: string;
};

export async function createHabit(input: HabitInput): Promise<string> {
  const now = new Date().toISOString();
  const maxOrder = await db.habits.orderBy('sortOrder').last();
  const id = uid();
  const habit: Habit = {
    id,
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    icon: input.icon?.trim() || '✨',
    pillar: input.pillar,
    color: input.color ?? '#F0B429',
    frequency: input.frequency,
    targetPerDay: input.targetPerDay ?? 1,
    reminderTime: input.reminderTime,
    archived: false,
    sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.habits.add(habit);
  await db.activityLogs.add({
    id: uid(),
    entity: 'habit',
    action: 'created',
    summary: `Created habit “${habit.name}”`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateHabit(
  id: string,
  input: HabitInput,
): Promise<void> {
  const now = new Date().toISOString();
  await db.habits.update(id, {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    icon: input.icon?.trim() || '✨',
    pillar: input.pillar,
    color: input.color,
    frequency: input.frequency,
    targetPerDay: input.targetPerDay ?? 1,
    reminderTime: input.reminderTime,
    updatedAt: now,
  });
}

export async function deleteHabit(id: string): Promise<void> {
  await db.transaction('rw', db.habits, db.habitLogs, db.activityLogs, async () => {
    await db.habitLogs.where('habitId').equals(id).delete();
    await db.habits.delete(id);
    await db.activityLogs.add({
      id: uid(),
      entity: 'habit',
      action: 'deleted',
      summary: 'Deleted a habit',
      entityId: id,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function setHabitArchived(
  id: string,
  archived: boolean,
): Promise<void> {
  await db.habits.update(id, {
    archived,
    updatedAt: new Date().toISOString(),
  });
}

export async function reorderHabit(id: string, direction: 'up' | 'down') {
  const habits = await db.habits.orderBy('sortOrder').toArray();
  const index = habits.findIndex((h) => h.id === id);
  if (index < 0) return;
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= habits.length) return;
  const a = habits[index]!;
  const b = habits[swapWith]!;
  await db.transaction('rw', db.habits, async () => {
    await db.habits.update(a.id, { sortOrder: b.sortOrder });
    await db.habits.update(b.id, { sortOrder: a.sortOrder });
  });
}

export function useArchivedHabitsLive() {
  return useLiveQuery(
    () => db.habits.filter((h) => h.archived).sortBy('sortOrder'),
    [],
  );
}

export async function toggleHabitToday(habit: Habit): Promise<void> {
  const today = todayKey();
  const now = new Date().toISOString();
  const existing = await db.habitLogs
    .where('[habitId+date]')
    .equals([habit.id, today])
    .first();

  if (existing && existing.count >= habit.targetPerDay) {
    await db.habitLogs.delete(existing.id);
    return;
  }

  if (existing) {
    await db.habitLogs.update(existing.id, {
      count: habit.targetPerDay,
    });
  } else {
    const log: HabitLog = {
      id: uid(),
      habitId: habit.id,
      date: today,
      count: habit.targetPerDay,
      createdAt: now,
    };
    await db.habitLogs.add(log);
  }

  await db.activityLogs.add({
    id: uid(),
    entity: 'habit',
    action: 'toggled',
    summary: `Logged habit “${habit.name}” for ${today}`,
    entityId: habit.id,
    createdAt: now,
  });
}
