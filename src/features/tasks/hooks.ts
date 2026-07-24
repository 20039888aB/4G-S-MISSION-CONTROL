import { useLiveQuery } from 'dexie-react-hooks';
import {
  endOfDay,
  isBefore,
  isToday,
  isValid,
  parseISO,
  startOfDay,
} from 'date-fns';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type { Task, TaskPriority, TaskStatus, TaskSubtask } from '@/types';

export type TaskFilter = 'today' | 'upcoming' | 'completed' | 'all';

export type TaskInput = {
  title: string;
  description?: string;
  priority: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
  tags: string[];
  subtasks?: TaskSubtask[];
  goalId?: string;
};

function parseDue(dueDate?: string): Date | null {
  if (!dueDate) return null;
  const parsed = parseISO(dueDate.length === 10 ? `${dueDate}T12:00:00` : dueDate);
  return isValid(parsed) ? parsed : null;
}

export function matchesTaskFilter(task: Task, filter: TaskFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'completed') return task.status === 'done';
  if (task.status === 'done' || task.status === 'cancelled') return false;

  const due = parseDue(task.dueDate);
  if (filter === 'today') {
    if (!due) return task.status === 'todo' || task.status === 'in_progress';
    return isToday(due);
  }
  if (filter === 'upcoming') {
    if (!due) return false;
    const now = startOfDay(new Date());
    return !isToday(due) && !isBefore(endOfDay(due), now);
  }
  return true;
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function useTasksLive(filter: TaskFilter = 'all') {
  return useLiveQuery(async () => {
    const tasks = await db.tasks.toArray();
    return tasks
      .filter((t) => matchesTaskFilter(t, filter))
      .sort((a, b) => {
        const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (pr !== 0) return pr;
        const ad = a.dueDate ?? '9999';
        const bd = b.dueDate ?? '9999';
        if (ad !== bd) return ad.localeCompare(bd);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [filter]);
}

export async function createTask(input: TaskInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const task: Task = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    status: input.status ?? 'todo',
    priority: input.priority,
    dueDate: input.dueDate || undefined,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    subtasks: input.subtasks ?? [],
    goalId: input.goalId,
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(task);
  await db.activityLogs.add({
    id: uid(),
    entity: 'task',
    action: 'created',
    summary: `Created task “${task.title}”`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateTask(id: string, input: TaskInput): Promise<void> {
  const now = new Date().toISOString();
  await db.tasks.update(id, {
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    priority: input.priority,
    status: input.status,
    dueDate: input.dueDate || undefined,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    subtasks: input.subtasks ?? [],
    goalId: input.goalId,
    updatedAt: now,
  });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  await db.activityLogs.add({
    id: uid(),
    entity: 'task',
    action: 'deleted',
    summary: 'Deleted a task',
    entityId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function toggleTaskComplete(task: Task): Promise<void> {
  const now = new Date().toISOString();
  const done = task.status === 'done';
  await db.tasks.update(task.id, {
    status: done ? 'todo' : 'done',
    completedAt: done ? undefined : now,
    updatedAt: now,
  });
}

export async function toggleSubtask(
  task: Task,
  subtaskId: string,
): Promise<void> {
  const now = new Date().toISOString();
  const subtasks = (task.subtasks ?? []).map((s) =>
    s.id === subtaskId ? { ...s, completed: !s.completed } : s,
  );
  await db.tasks.update(task.id, { subtasks, updatedAt: now });
}

export function newSubtask(title: string): TaskSubtask {
  return { id: uid(), title: title.trim(), completed: false };
}
