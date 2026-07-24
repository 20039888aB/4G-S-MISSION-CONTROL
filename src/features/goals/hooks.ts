import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { clamp, uid } from '@/lib/utils';
import type {
  G4Pillar,
  Goal,
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
}

export async function deleteGoal(id: string): Promise<void> {
  await db.goals.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'goal',
    action: 'deleted',
    summary: 'Deleted a goal',
    entityId: id,
    createdAt: new Date().toISOString(),
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
}

export function newMilestone(title: string): GoalMilestone {
  return {
    id: uid(),
    title: title.trim(),
    completed: false,
  };
}
