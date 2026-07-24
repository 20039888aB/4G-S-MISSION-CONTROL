import { AnimatePresence, motion } from 'framer-motion';
import { Check, LayoutList, Columns3, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import { db } from '@/db/database';
import {
  createTask,
  deleteTask,
  newSubtask,
  toggleSubtask,
  toggleTaskComplete,
  updateTask,
  useTasksLive,
  type TaskFilter,
  type TaskInput,
} from '@/features/tasks/hooks';
import { cn, formatDate } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { Goal, Task, TaskPriority, TaskSubtask } from '@/types';

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'All' },
];

const PRIORITY_OPTS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const PRIORITY_TONE: Record<TaskPriority, 'danger' | 'warning' | 'accent' | 'neutral'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'accent',
  low: 'neutral',
};

function TaskForm({
  initial,
  goals,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Task | null;
  goals: Goal[];
  onSubmit: (input: TaskInput) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority ?? 'medium');
  const [dueDate, setDueDate] = useState(initial?.dueDate?.slice(0, 10) ?? '');
  const [goalId, setGoalId] = useState(initial?.goalId ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>(initial?.subtasks ?? []);
  const [draft, setDraft] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      goalId: goalId || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      subtasks,
      status: initial?.status,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={PRIORITY_OPTS}
        />
        <Input
          label="Due date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
      <Select
        label="Linked goal"
        value={goalId}
        onChange={(e) => setGoalId(e.target.value)}
        options={[
          { value: '', label: 'No linked goal' },
          ...goals.map((g) => ({ value: g.id, label: g.title })),
        ]}
      />
      <Input
        label="Tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="work, deep-work"
        hint="Comma-separated"
      />
      <div className="space-y-2">
        <p className="text-sm font-medium">Subtasks</p>
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Subtask…" />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!draft.trim()) return;
              setSubtasks((s) => [...s, newSubtask(draft)]);
              setDraft('');
            }}
          >
            Add
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {subtasks.map((s) => (
            <li key={s.id} className="flex justify-between rounded-lg border border-border px-3 py-1.5">
              <span>{s.title}</span>
              <button
                type="button"
                className="text-xs text-danger"
                onClick={() => setSubtasks((list) => list.filter((x) => x.id !== s.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}

function PomodoroPanel({ task }: { task: Task | null }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setRunning(false);
          const next = mode === 'focus' ? 'break' : 'focus';
          setMode(next);
          return next === 'focus' ? 25 * 60 : 5 * 60;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <Card glass className="p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Pomodoro</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums">
        {mm}:{ss}
      </p>
      <p className="mt-1 text-sm text-text-muted">
        {mode === 'focus' ? 'Focus' : 'Break'}
        {task ? ` · ${task.title}` : ' · Select a task'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setRunning((r) => !r)} disabled={!task && mode === 'focus'}>
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setRunning(false);
            setMode('focus');
            setSeconds(25 * 60);
          }}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </Card>
  );
}

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [board, setBoard] = useState(false);
  const tasks = useTasksLive(filter);
  const goals =
    useLiveQuery(
      () => db.goals.filter((g) => g.status === 'active' || g.status === 'paused').toArray(),
      [],
    ) ?? [];
  const addToast = useUiStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [selected, setSelected] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const byPriority = useMemo(() => {
    const groups: Record<TaskPriority, Task[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
    };
    for (const t of tasks ?? []) groups[t.priority].push(t);
    return groups;
  }, [tasks]);

  async function handleSubmit(input: TaskInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateTask(editing.id, input);
        addToast('success', 'Task updated');
      } else {
        await createTask(input);
        addToast('success', 'Task created');
      }
      setOpen(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  }

  function TaskRow({ task }: { task: Task }) {
    const done = task.status === 'done';
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <Card
          glass
          className={cn(
            'p-4 transition',
            selected?.id === task.id && 'ring-1 ring-accent/50',
          )}
        >
          <div className="flex items-start gap-3">
            <button
              type="button"
              aria-label={done ? 'Mark incomplete' : 'Complete'}
              onClick={() => void toggleTaskComplete(task)}
              className={cn(
                'mt-0.5 flex size-6 items-center justify-center rounded-md border',
                done ? 'border-accent bg-accent text-[var(--bg)]' : 'border-border',
              )}
            >
              {done ? <Check className="size-3.5" /> : null}
            </button>
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => setSelected(task)}
            >
              <p className={cn('font-medium', done && 'text-text-muted line-through')}>
                {task.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <Badge tone={PRIORITY_TONE[task.priority]}>{task.priority}</Badge>
                {task.dueDate ? (
                  <span className="text-xs text-text-muted">{formatDate(task.dueDate)}</span>
                ) : null}
                {task.tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              {(task.subtasks?.length ?? 0) > 0 ? (
                <ul className="mt-2 space-y-1">
                  {task.subtasks!.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void toggleSubtask(task, s.id);
                        }}
                        className="flex items-center gap-2 text-xs text-text-muted"
                      >
                        <span
                          className={cn(
                            'size-3.5 rounded border',
                            s.completed ? 'border-accent bg-accent' : 'border-border',
                          )}
                        />
                        <span className={cn(s.completed && 'line-through')}>{s.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </button>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(task);
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Delete"
                onClick={() => void deleteTask(task.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Prioritize the grind. Finish what matters."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add task
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'primary' : 'secondary'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <LayoutList className="size-4" />
          <Toggle checked={board} onChange={setBoard} label="Board" />
          <Columns3 className="size-4" />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          {!tasks ? null : tasks.length === 0 ? (
            <EmptyState
              title="No tasks here"
              description="Capture the next action that moves a goal forward."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="size-4" />
                  Add task
                </Button>
              }
            />
          ) : board ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(byPriority) as TaskPriority[]).map((p) => (
                <div key={p} className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {p}
                  </p>
                  <AnimatePresence mode="popLayout">
                    {byPriority[p].map((task) => (
                      <TaskRow key={task.id} task={task} />
                    ))}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {tasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </AnimatePresence>
          )}
        </div>
        <PomodoroPanel task={selected} />
      </div>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit task' : 'New task'}
      >
        <TaskForm
          key={editing?.id ?? 'new'}
          initial={editing}
          goals={goals}
          submitting={submitting}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}
