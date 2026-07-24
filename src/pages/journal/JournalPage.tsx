import { motion } from 'framer-motion';
import { NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { clamp, formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { JournalEntry } from '@/types';

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

type JournalInput = {
  date: string;
  title?: string;
  content: string;
  mood?: number;
  energy?: number;
  stress?: number;
};

const MOOD_FILTERS = [
  { value: 'all', label: 'All moods' },
  { value: '1-3', label: 'Low (1–3)' },
  { value: '4-6', label: 'Mid (4–6)' },
  { value: '7-10', label: 'High (7–10)' },
];

function matchesMoodFilter(mood: number | undefined, filter: string): boolean {
  if (filter === 'all') return true;
  if (mood == null) return filter === 'all';
  if (filter === '1-3') return mood >= 1 && mood <= 3;
  if (filter === '4-6') return mood >= 4 && mood <= 6;
  if (filter === '7-10') return mood >= 7 && mood <= 10;
  return true;
}

function ScaleInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="flex items-center justify-between font-medium text-text">
        {label}
        <span className="text-accent">{value}/10</span>
      </span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-[var(--color-accent,#F0B429)]"
      />
    </label>
  );
}

export default function JournalPage() {
  const addToast = useUiStore((s) => s.addToast);
  const entries = useLiveQuery(() => db.journalEntries.toArray(), []);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(
    () =>
      [...(entries ?? [])]
        .filter((e) => matchesMoodFilter(e.mood, filter))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [entries, filter],
  );

  async function onSave(input: JournalInput) {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        date: input.date,
        title: input.title?.trim() || undefined,
        content: input.content.trim(),
        mood: input.mood,
        energy: input.energy,
        stress: input.stress,
        tags: editing?.tags ?? [],
        updatedAt: now,
      };
      if (editing) {
        await db.journalEntries.update(editing.id, payload);
        addToast('success', 'Entry updated.');
      } else {
        await db.journalEntries.add({
          id: uid(),
          ...payload,
          createdAt: now,
        });
        addToast('success', 'Journal entry saved.');
      }
      setOpen(false);
      setEditing(null);
    } catch {
      addToast('danger', 'Could not save entry.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gratitude"
        title="Journal"
        description="Rich daily notes with mood, energy, and stress scales."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            New entry
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Select
            label="Filter by mood"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={MOOD_FILTERS}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card glass>
          <EmptyState
            icon={NotebookPen}
            title="No journal entries"
            description="Write what the day felt like — body and mind included."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="size-4" />
                New entry
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card glass className="h-full">
                <CardHeader>
                  <div>
                    <CardTitle className="text-base">
                      {entry.title || formatDate(entry.date, 'EEEE, MMM d')}
                    </CardTitle>
                    <p className="text-xs text-text-muted">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {entry.mood != null ? (
                      <Badge tone="gratitude">Mood {entry.mood}</Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <p className="mb-3 text-sm text-text-muted line-clamp-4 whitespace-pre-wrap">
                  {entry.content}
                </p>
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-text-muted">
                  {entry.energy != null ? <span>Energy {entry.energy}/10</span> : null}
                  {entry.stress != null ? <span>Stress {entry.stress}/10</span> : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setEditing(entry);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      await db.journalEntries.delete(entry.id);
                      addToast('success', 'Entry removed.');
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit journal' : 'New journal entry'}
        size="lg"
      >
        <JournalForm
          initial={editing}
          submitting={busy}
          onCancel={() => {
            setOpen(false);
            setEditing(null);
          }}
          onSubmit={onSave}
        />
      </Modal>
    </div>
  );
}

function JournalForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: JournalEntry | null;
  submitting: boolean;
  onSubmit: (input: JournalInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [mood, setMood] = useState(initial?.mood ?? 5);
  const [energy, setEnergy] = useState(initial?.energy ?? 5);
  const [stress, setStress] = useState(initial?.stress ?? 5);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setError('Content is required');
      return;
    }
    await onSubmit({
      date,
      title,
      content,
      mood: clamp(mood, 1, 10),
      energy: clamp(energy, 1, 10),
      stress: clamp(stress, 1, 10),
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <Textarea
        label="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        error={error}
        autoFocus
      />
      <ScaleInput label="Mood" value={mood} onChange={setMood} />
      <ScaleInput label="Energy" value={energy} onChange={setEnergy} />
      <ScaleInput label="Stress" value={stress} onChange={setStress} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Create'}
        </Button>
      </div>
    </form>
  );
}
