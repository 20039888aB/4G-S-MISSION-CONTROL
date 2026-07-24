import { AnimatePresence, motion } from 'framer-motion';
import {
  Archive,
  ArchiveRestore,
  ChevronDown,
  ChevronUp,
  Flame,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Progress,
} from '@/components/ui';
import { HabitForm } from '@/features/habits/HabitForm';
import {
  createHabit,
  deleteHabit,
  reorderHabit,
  setHabitArchived,
  toggleHabitToday,
  updateHabit,
  useArchivedHabitsLive,
  useHabitsLive,
  type HabitInput,
  type HabitWithMeta,
} from '@/features/habits/hooks';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { Habit } from '@/types';

function ProgressRing({ value }: { value: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative size-24">
      <svg className="size-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-text">{value}%</span>
        <span className="text-[10px] uppercase tracking-wider text-text-muted">Today</span>
      </div>
    </div>
  );
}

function HabitCard({
  habit,
  onEdit,
  onDelete,
  onArchive,
}: {
  habit: HabitWithMeta;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
    >
      <Card glass className="p-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => void toggleHabitToday(habit)}
            aria-label={habit.doneToday ? `Undo ${habit.name}` : `Complete ${habit.name}`}
            className={cn(
              'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border text-xl transition',
              habit.doneToday
                ? 'border-accent/50 bg-accent/20 shadow-[0_0_20px_rgba(240,180,41,0.25)]'
                : 'border-border bg-surface hover:border-accent/40',
            )}
          >
            {habit.icon || '✨'}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  className={cn(
                    'font-display text-base font-semibold',
                    habit.doneToday && 'text-text-muted line-through',
                  )}
                >
                  {habit.name}
                </h3>
                {habit.description ? (
                  <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">{habit.description}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Move up"
                  onClick={() => void reorderHabit(habit.id, 'up')}
                >
                  <ChevronUp className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Move down"
                  onClick={() => void reorderHabit(habit.id, 'down')}
                >
                  <ChevronDown className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Edit" onClick={onEdit}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Archive" onClick={onArchive}>
                  <Archive className="size-3.5" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Delete" onClick={onDelete}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone={habit.doneToday ? 'success' : 'neutral'}>
                {habit.doneToday ? 'Done' : 'Pending'}
              </Badge>
              {habit.pillar ? <Badge tone="accent">{habit.pillar}</Badge> : null}
              <span className="inline-flex items-center gap-1 text-xs text-accent">
                <Flame className="size-3.5" />
                {habit.streak} day streak
              </span>
            </div>
            <div className="mt-3 flex gap-1" aria-label="Last 7 days">
              {habit.week.map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.done ? 'done' : 'missed'}`}
                  className={cn(
                    'h-7 flex-1 rounded-md transition',
                    day.done ? 'bg-accent/80' : 'bg-border/60',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export default function HabitsPage() {
  const data = useHabitsLive();
  const archived = useArchivedHabitsLive();
  const addToast = useUiStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HabitWithMeta | Habit | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<HabitWithMeta | Habit | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  async function handleSubmit(input: HabitInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateHabit(editing.id, input);
        addToast('success', 'Habit updated');
      } else {
        await createHabit(input);
        addToast('success', 'Habit created');
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
        title="Daily Habits"
        description="Small consistent actions lead to extraordinary success."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowArchived((v) => !v)}
            >
              <Archive className="size-4" />
              {showArchived ? 'Hide archived' : `Archived (${archived?.length ?? 0})`}
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add habit
            </Button>
          </div>
        }
      />

      <Card glass className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
        <ProgressRing value={data?.completionPct ?? 0} />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <p className="font-display text-lg font-semibold">
            {data ? `${data.doneCount} of ${data.total} complete` : 'Loading…'}
          </p>
          <p className="text-sm text-text-muted">
            Discipline compounds. Close the loop on today&apos;s mission.
          </p>
          <Progress value={data?.completionPct ?? 0} />
        </div>
      </Card>

      {!data ? (
        <div className="grid gap-3 sm:grid-cols-2">{/* loading */}</div>
      ) : data.habits.length === 0 ? (
        <EmptyState
          title="No habits yet"
          description="Seed defaults load on first launch — or create your own discipline stack."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Create habit
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {data.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onEdit={() => {
                  setEditing(habit);
                  setOpen(true);
                }}
                onDelete={() => setConfirmDelete(habit)}
                onArchive={async () => {
                  await setHabitArchived(habit.id, true);
                  addToast('success', 'Habit archived — restore anytime');
                }}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {showArchived && (archived?.length ?? 0) > 0 ? (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-semibold">Archived habits</h3>
          <div className="grid gap-3 lg:grid-cols-2">
            {archived!.map((habit) => (
              <Card key={habit.id} className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {habit.icon} {habit.name}
                  </p>
                  <p className="text-xs text-text-muted">Paused — not tracked daily</p>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await setHabitArchived(habit.id, false);
                      addToast('success', 'Habit restored');
                    }}
                  >
                    <ArchiveRestore className="size-3.5" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(habit)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit habit' : 'New habit'}
      >
        <HabitForm
          initial={editing}
          submitting={submitting}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        title="Delete habit?"
      >
        <p className="text-sm text-text-muted">
          Remove <strong className="text-text">{confirmDelete?.name}</strong> and its history?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirmDelete) return;
              await deleteHabit(confirmDelete.id);
              setConfirmDelete(null);
              addToast('success', 'Habit deleted');
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
