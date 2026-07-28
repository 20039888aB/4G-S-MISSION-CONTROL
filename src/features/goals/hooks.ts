import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { clamp, uid } from '@/lib/utils';
import type {
  G4Pillar,
  Goal,
  GoalDayLog,
  GoalMilestone,
  GoalStatus,
} from '@/types';

export type GoalInput = {
  title: string;
  description?: string;
  pillar?: G4Pillar;
  status: GoalStatus;
  progress: number;
  targetDate?: string;
  milestones?: GoalMilestone[];
};

/** Local calendar YYYY-MM-DD (avoids UTC day-shift on phones). */
export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftLocalDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y!, m! - 1, d!);
  dt.setDate(dt.getDate() + days);
  return localDateKey(dt);
}

export function progressFromMilestones(milestones: GoalMilestone[]): number {
  if (milestones.length === 0) return 0;
  const done = milestones.filter((m) => m.completed).length;
  return Math.round((done / milestones.length) * 100);
}

export function useGoalsLive() {
  return useLiveQuery(async () => {
    const goals = await db.goals.toArray();
    return goals.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, []);
}

export function useGoalDayLogsLive(days = 14) {
  const start = shiftLocalDateKey(localDateKey(), -(days - 1));
  return useLiveQuery(async () => {
    const logs = await db.goalDayLogs.where('date').aboveOrEqual(start).toArray();
    return logs.sort((a, b) => a.date.localeCompare(b.date));
  }, [start]);
}

export async function recordGoalDaySnapshot(
  goalId: string,
  progress: number,
  options?: { worked?: boolean; note?: string; date?: string },
): Promise<void> {
  const date = options?.date ?? localDateKey();
  const now = new Date().toISOString();
  const progressClamped = clamp(progress, 0, 100);

  const existing = await db.goalDayLogs
    .where('[goalId+date]')
    .equals([goalId, date])
    .first();

  let previousProgress = progressClamped;
  if (existing) {
    previousProgress = existing.previousProgress;
  } else {
    const prior = await db.goalDayLogs
      .where('goalId')
      .equals(goalId)
      .filter((l) => l.date < date)
      .toArray();
    prior.sort((a, b) => b.date.localeCompare(a.date));
    if (prior[0]) previousProgress = prior[0].progress;
    else {
      const goal = await db.goals.get(goalId);
      previousProgress = goal?.progress ?? progressClamped;
    }
  }

  const delta = progressClamped - previousProgress;
  const worked = options?.worked ?? existing?.worked ?? delta !== 0;
  const note = options?.note ?? existing?.note;

  if (existing) {
    await db.goalDayLogs.update(existing.id, {
      progress: progressClamped,
      previousProgress,
      delta,
      worked: Boolean(worked),
      note,
      updatedAt: now,
    });
    return;
  }

  const row: GoalDayLog = {
    id: uid(),
    goalId,
    date,
    progress: progressClamped,
    previousProgress,
    delta,
    worked: Boolean(worked),
    note,
    createdAt: now,
    updatedAt: now,
  };
  await db.goalDayLogs.add(row);
}

export async function markGoalWorkedToday(
  goal: Goal,
  note?: string,
): Promise<void> {
  await recordGoalDaySnapshot(goal.id, goal.progress, {
    worked: true,
    note: note?.trim() || undefined,
  });
}

export async function createGoal(input: GoalInput): Promise<string> {
  const now = new Date().toISOString();
  const milestones = input.milestones ?? [];
  const progress =
    milestones.length > 0
      ? progressFromMilestones(milestones)
      : clamp(input.progress, 0, 100);
  const id = uid();
  const goal: Goal = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    pillar: input.pillar,
    status: input.status,
    progress,
    targetDate: input.targetDate || undefined,
    milestones,
    createdAt: now,
    updatedAt: now,
  };
  await db.goals.add(goal);
  await recordGoalDaySnapshot(id, progress, { worked: false });
  await db.activityLogs.add({
    id: uid(),
    entity: 'goal',
    action: 'created',
    summary: `Created goal “${goal.title}”`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateGoal(id: string, input: GoalInput): Promise<void> {
  const now = new Date().toISOString();
  const milestones = input.milestones ?? [];
  const progress =
    milestones.length > 0
      ? progressFromMilestones(milestones)
      : clamp(input.progress, 0, 100);
  await db.goals.update(id, {
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    pillar: input.pillar,
    status: input.status,
    progress,
    targetDate: input.targetDate || undefined,
    milestones,
    updatedAt: now,
  });
  await recordGoalDaySnapshot(id, progress);
}

export async function deleteGoal(id: string): Promise<void> {
  await db.transaction('rw', db.goals, db.goalDayLogs, db.activityLogs, async () => {
    await db.goals.delete(id);
    await db.goalDayLogs.where('goalId').equals(id).delete();
    await db.activityLogs.add({
      id: uid(),
      entity: 'goal',
      action: 'deleted',
      summary: 'Deleted a goal',
      entityId: id,
      createdAt: new Date().toISOString(),
    });
  });
}

export async function toggleMilestone(
  goal: Goal,
  milestoneId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const milestones = goal.milestones.map((m) => {
    if (m.id !== milestoneId) return m;
    const completed = !m.completed;
    return {
      ...m,
      completed,
      completedAt: completed ? now : undefined,
    };
  });
  const progress = progressFromMilestones(milestones);
  const status: GoalStatus =
    progress >= 100 && goal.status === 'active' ? 'completed' : goal.status;

  await db.goals.update(goal.id, {
    milestones,
    progress,
    status,
    updatedAt: now,
  });
  await recordGoalDaySnapshot(goal.id, progress, { worked: true });
}

export function newMilestone(title: string): GoalMilestone {
  return {
    id: uid(),
    title: title.trim(),
    completed: false,
  };
}

export interface GoalWeekDay {
  date: string;
  label: string;
  isToday: boolean;
  /** Average progress across active goals that day (or latest known) */
  avgProgress: number;
  /** How many active goals were worked that day */
  workedCount: number;
  /** Net progress points gained that day across goals */
  netDelta: number;
}

export interface WeeklyGoalReport {
  days: GoalWeekDay[];
  activeGoalCount: number;
  daysWorked: number;
  goalsTouched: number;
  netProgressThisWeek: number;
  avgProgressNow: number;
  bestDay: GoalWeekDay | null;
  momentum: 'rising' | 'steady' | 'cooling' | 'quiet';
  headline: string;
  coachingLine: string;
}

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function buildWeeklyGoalReport(
  goals: Goal[],
  logs: GoalDayLog[],
  now = new Date(),
): WeeklyGoalReport {
  const today = localDateKey(now);
  const active = goals.filter((g) => g.status === 'active');
  const activeIds = new Set(active.map((g) => g.id));
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    shiftLocalDateKey(today, i - 6),
  );

  const days: GoalWeekDay[] = weekDates.map((date) => {
    const dayLogs = logs.filter(
      (l) => l.date === date && activeIds.has(l.goalId),
    );
    const worked = dayLogs.filter((l) => l.worked);
    const netDelta = dayLogs.reduce((s, l) => s + Math.max(0, l.delta), 0);
    const avgProgress =
      dayLogs.length > 0
        ? Math.round(
            dayLogs.reduce((s, l) => s + l.progress, 0) / dayLogs.length,
          )
        : active.length
          ? Math.round(
              active.reduce((s, g) => s + g.progress, 0) / active.length,
            )
          : 0;

    const [y, m, d] = date.split('-').map(Number);
    const dt = new Date(y!, m! - 1, d!);
    return {
      date,
      label: WEEKDAY_SHORT[dt.getDay()]!,
      isToday: date === today,
      avgProgress,
      workedCount: worked.length,
      netDelta,
    };
  });

  const daysWorked = days.filter((d) => d.workedCount > 0).length;
  const goalsTouched = new Set(
    logs
      .filter(
        (l) =>
          activeIds.has(l.goalId) &&
          l.worked &&
          l.date >= weekDates[0]! &&
          l.date <= today,
      )
      .map((l) => l.goalId),
  ).size;
  const netProgressThisWeek = days.reduce((s, d) => s + d.netDelta, 0);
  const avgProgressNow = active.length
    ? Math.round(active.reduce((s, g) => s + g.progress, 0) / active.length)
    : 0;
  const bestDay =
    [...days].sort(
      (a, b) => b.workedCount - a.workedCount || b.netDelta - a.netDelta,
    )[0] ?? null;

  const firstHalf = days.slice(0, 3).reduce((s, d) => s + d.workedCount, 0);
  const secondHalf = days.slice(4).reduce((s, d) => s + d.workedCount, 0);
  let momentum: WeeklyGoalReport['momentum'] = 'quiet';
  if (daysWorked === 0) momentum = 'quiet';
  else if (secondHalf > firstHalf) momentum = 'rising';
  else if (secondHalf < firstHalf && daysWorked >= 2) momentum = 'cooling';
  else momentum = 'steady';

  let headline = 'No goal activity logged this week yet.';
  if (active.length === 0) headline = 'No active goals — set one and start stacking days.';
  else if (daysWorked >= 5)
    headline = `Strong week: ${daysWorked}/7 days with goal work.`;
  else if (daysWorked >= 3)
    headline = `Solid rhythm: ${daysWorked} days touched this week.`;
  else if (daysWorked >= 1)
    headline = `${daysWorked} day${daysWorked === 1 ? '' : 's'} logged — keep the chain alive.`;

  let coachingLine =
    'Mark “Worked today” on a goal after even 15 focused minutes.';
  if (momentum === 'rising')
    coachingLine = 'Momentum is rising. Protect one focused block tomorrow.';
  else if (momentum === 'cooling')
    coachingLine = 'Pace dipped mid-week. One small win today restores the chain.';
  else if (daysWorked >= 5)
    coachingLine = 'Elite consistency. Close one milestone before Sunday.';
  else if (active.length === 0)
    coachingLine = 'Create one 90-day goal, then log progress daily.';

  return {
    days,
    activeGoalCount: active.length,
    daysWorked,
    goalsTouched,
    netProgressThisWeek,
    avgProgressNow,
    bestDay: bestDay && bestDay.workedCount > 0 ? bestDay : null,
    momentum,
    headline,
    coachingLine,
  };
}

export function useWeeklyGoalReport() {
  const goals = useGoalsLive();
  const logs = useGoalDayLogsLive(14);
  if (!goals || !logs) return null;
  return buildWeeklyGoalReport(goals, logs);
}
