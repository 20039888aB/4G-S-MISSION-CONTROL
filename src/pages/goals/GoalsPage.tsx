import { AnimatePresence, motion } from 'framer-motion';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { GoalWeekStrip } from '@/components/goals/GoalWeekStrip';
import { WeeklyGoalsPulse } from '@/components/goals/WeeklyGoalsPulse';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Progress,
  Select,
  Textarea,
} from '@/components/ui';
import {
  createGoal,
  deleteGoal,
  localDateKey,
  markGoalWorkedToday,
  newMilestone,
  toggleMilestone,
  updateGoal,
  useGoalDayLogsLive,
  useGoalsLive,
  useWeeklyGoalReport,
  type GoalInput,
} from '@/features/goals/hooks';
import { cn, formatDate } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { G4Pillar, Goal, GoalMilestone, GoalStatus } from '@/types';

const STATUS_OPTS: { value: GoalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'abandoned', label: 'Abandoned' },
];

const PILLAR_OPTS = [
  { value: '', label: 'All pillars' },
  { value: 'god', label: 'God' },
  { value: 'goals', label: 'Goals' },
  { value: 'grinding', label: 'Grinding' },
  { value: 'gratitude', label: 'Gratitude' },
];

function urgency(targetDate?: string): 'overdue' | 'soon' | 'ok' | 'none' {
  if (!targetDate) return 'none';
  const days = Math.ceil(
    (new Date(`${targetDate}T12:00:00`).getTime() - Date.now()) / 86400000,
  );
  if (days < 0) return 'overdue';
  if (days <= 14) return 'soon';
  return 'ok';
}

function GoalForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Goal | null;
  onSubmit: (input: GoalInput) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [pillar, setPillar] = useState(initial?.pillar ?? '');
  const [status, setStatus] = useState<GoalStatus>(initial?.status ?? 'active');
  const [progress, setProgress] = useState(initial?.progress ?? 0);
  const [targetDate, setTargetDate] = useState(initial?.targetDate?.slice(0, 10) ?? '');
  const [milestones, setMilestones] = useState<GoalMilestone[]>(initial?.milestones ?? []);
  const [milestoneDraft, setMilestoneDraft] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await onSubmit({
      title,
      description,
      pillar: (pillar || undefined) as G4Pillar | undefined,
      status,
      progress,
      targetDate: targetDate || undefined,
      milestones,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Pillar"
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          options={[
            { value: '', label: 'None' },
            ...PILLAR_OPTS.filter((o) => o.value),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as GoalStatus)}
          options={STATUS_OPTS}
        />
        <Input
          label="Target date"
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
        />
        <Input
          label="Progress %"
          type="number"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          hint={milestones.length ? 'Overridden by milestones' : undefined}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-text">Milestones</p>
        <div className="flex gap-2">
          <Input
            value={milestoneDraft}
            onChange={(e) => setMilestoneDraft(e.target.value)}
            placeholder="Add a milestone…"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (!milestoneDraft.trim()) return;
              setMilestones((m) => [...m, newMilestone(milestoneDraft)]);
              setMilestoneDraft('');
            }}
          >
            Add
          </Button>
        </div>
        <ul className="space-y-1">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
            >
              <span className={cn(m.completed && 'text-text-muted line-through')}>{m.title}</span>
              <button
                type="button"
                className="text-xs text-danger"
                onClick={() => setMilestones((list) => list.filter((x) => x.id !== m.id))}
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
          {initial ? 'Save' : 'Create goal'}
        </Button>
      </div>
    </form>
  );
}

export default function GoalsPage() {
  const goals = useGoalsLive();
  const dayLogs = useGoalDayLogsLive(14);
  const weekly = useWeeklyGoalReport();
  const addToast = useUiStore((s) => s.addToast);
  const [pillarFilter, setPillarFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toDelete, setToDelete] = useState<Goal | null>(null);
  const today = localDateKey();

  const filtered = useMemo(() => {
    return (goals ?? []).filter((g) => {
      if (pillarFilter && g.pillar !== pillarFilter) return false;
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      return true;
    });
  }, [goals, pillarFilter, statusFilter]);

  async function handleSubmit(input: GoalInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateGoal(editing.id, input);
        addToast('success', 'Goal updated');
      } else {
        await createGoal(input);
        addToast('success', 'Goal created');
      }
      setOpen(false);
      setEditing(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Track daily progress separately, then review the week — one day at a time."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            New goal
          </Button>
        }
      />

      <WeeklyGoalsPulse report={weekly} />

      <div className="flex flex-wrap gap-3">
        <Select
          value={pillarFilter}
          onChange={(e) => setPillarFilter(e.target.value)}
          options={PILLAR_OPTS}
          className="w-40"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'all')}
          options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTS]}
          className="w-44"
        />
      </div>

      {!goals ? null : filtered.length === 0 ? (
        <EmptyState
          title="No goals match"
          description="Set a target worth grinding for — then log work every day."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {filtered.map((goal) => {
              const u = urgency(goal.targetDate);
              const workedToday = (dayLogs ?? []).some(
                (l) => l.goalId === goal.id && l.date === today && l.worked,
              );
              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Card glass className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-lg font-semibold">{goal.title}</h3>
                        {goal.description ? (
                          <p className="mt-1 text-sm text-text-muted">{goal.description}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete"
                        onClick={() => setToDelete(goal)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="accent">{goal.status}</Badge>
                      {goal.pillar ? <Badge>{goal.pillar}</Badge> : null}
                      {u === 'overdue' ? <Badge tone="danger">Overdue</Badge> : null}
                      {u === 'soon' ? <Badge tone="warning">Due soon</Badge> : null}
                      {workedToday ? <Badge tone="success">Worked today</Badge> : null}
                      {goal.targetDate ? (
                        <span className="text-xs text-text-muted">
                          Target {formatDate(goal.targetDate)}
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-xs text-text-muted">
                        <span>Progress</span>
                        <span>{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium tracking-wide text-text-muted uppercase">
                        Last 7 days
                      </p>
                      <GoalWeekStrip goal={goal} logs={dayLogs ?? []} />
                    </div>
                    {goal.milestones.length > 0 ? (
                      <ul className="space-y-1.5">
                        {goal.milestones.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => void toggleMilestone(goal, m.id)}
                              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-surface"
                            >
                              <span
                                className={cn(
                                  'flex size-5 items-center justify-center rounded-md border',
                                  m.completed
                                    ? 'border-accent bg-accent text-[var(--bg)]'
                                    : 'border-border',
                                )}
                              >
                                {m.completed ? <Check className="size-3" /> : null}
                              </span>
                              <span className={cn(m.completed && 'text-text-muted line-through')}>
                                {m.title}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      {goal.status === 'active' ? (
                        <Button
                          variant={workedToday ? 'ghost' : 'secondary'}
                          size="sm"
                          disabled={workedToday}
                          onClick={async () => {
                            await markGoalWorkedToday(goal);
                            addToast('success', `Logged work on “${goal.title}”`);
                          }}
                        >
                          {workedToday ? 'Logged for today' : 'Worked today'}
                        </Button>
                      ) : null}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(goal);
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit goal' : 'New goal'}
      >
        <GoalForm
          key={editing?.id ?? 'new'}
          initial={editing}
          submitting={submitting}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete goal?">
        <p className="text-sm text-text-muted">
          Permanently remove <strong className="text-text">{toDelete?.title}</strong>? Day
          history for this goal will also be cleared.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!toDelete) return;
              await deleteGoal(toDelete.id);
              setToDelete(null);
              addToast('success', 'Goal deleted');
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
