import { motion } from 'framer-motion';
import { CalendarHeart, Heart, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { GratitudeEntry } from '@/types';

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

type GratitudeFormInput = {
  date: string;
  items: string[];
  biggestWin?: string;
  lessonLearned?: string;
  tomorrowBetter?: string;
};

export default function GratitudePage() {
  const addToast = useUiStore((s) => s.addToast);
  const entries = useLiveQuery(() => db.gratitudeEntries.toArray(), []);
  const today = todayKey();

  const todayEntry = useMemo(
    () => (entries ?? []).find((e) => e.date.slice(0, 10) === today) ?? null,
    [entries, today],
  );

  const past = useMemo(
    () =>
      [...(entries ?? [])]
        .sort((a, b) => b.date.localeCompare(a.date))
        .filter((e) => e.date.slice(0, 10) !== today),
    [entries, today],
  );

  const [b1, setB1] = useState('');
  const [b2, setB2] = useState('');
  const [b3, setB3] = useState('');
  const [biggestWin, setBiggestWin] = useState('');
  const [lessonLearned, setLessonLearned] = useState('');
  const [tomorrowBetter, setTomorrowBetter] = useState('');
  const [busy, setBusy] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<GratitudeEntry | null>(null);
  const [editBusy, setEditBusy] = useState(false);
  const [toDelete, setToDelete] = useState<GratitudeEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!todayEntry) return;
    setB1(todayEntry.items[0] ?? '');
    setB2(todayEntry.items[1] ?? '');
    setB3(todayEntry.items[2] ?? '');
    setBiggestWin(todayEntry.biggestWin ?? '');
    setLessonLearned(todayEntry.lessonLearned ?? '');
    setTomorrowBetter(todayEntry.tomorrowBetter ?? '');
    // Hydrate once per saved entry id — avoid clobbering while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntry?.id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const items = [b1, b2, b3].map((s) => s.trim()).filter(Boolean);
    if (items.length < 3) {
      addToast('warning', 'Capture three blessings.');
      return;
    }
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const payload: Omit<GratitudeEntry, 'id' | 'createdAt'> & {
        createdAt?: string;
      } = {
        date: today,
        items,
        biggestWin: biggestWin.trim() || undefined,
        lessonLearned: lessonLearned.trim() || undefined,
        tomorrowBetter: tomorrowBetter.trim() || undefined,
      };

      if (todayEntry) {
        await db.gratitudeEntries.update(todayEntry.id, payload);
        addToast('success', 'Today’s gratitude updated.');
      } else {
        await db.gratitudeEntries.add({
          id: uid(),
          ...payload,
          createdAt: now,
        });
        addToast('success', 'Gratitude logged for today.');
      }
    } catch {
      addToast('danger', 'Could not save gratitude.');
    } finally {
      setBusy(false);
    }
  }

  function openEdit(entry: GratitudeEntry) {
    setEditing(entry);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditing(null);
  }

  async function savePastEntry(input: GratitudeFormInput) {
    if (!editing) return;
    setEditBusy(true);
    try {
      await db.gratitudeEntries.update(editing.id, {
        date: input.date,
        items: input.items,
        biggestWin: input.biggestWin,
        lessonLearned: input.lessonLearned,
        tomorrowBetter: input.tomorrowBetter,
      });
      addToast('success', 'Gratitude entry updated.');
      closeEdit();
    } catch {
      addToast('danger', 'Could not update entry.');
    } finally {
      setEditBusy(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await db.gratitudeEntries.delete(toDelete.id);
      addToast('success', 'Gratitude entry removed.');
      setToDelete(null);
      if (editing?.id === toDelete.id) closeEdit();
    } catch {
      addToast('danger', 'Could not remove entry.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gratitude"
        title="Gratitude"
        description="Three blessings, one win, one lesson — train abundance daily."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Card glass className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>Today — {formatDate(today, 'EEEE, MMM d')}</CardTitle>
              <p className="text-sm text-text-muted">
                One entry per day (upserts if you edit).
              </p>
            </div>
            {todayEntry ? <Badge tone="gratitude">Saved</Badge> : null}
          </CardHeader>

          <form className="space-y-3" onSubmit={onSave}>
            <Input
              label="Blessing 1"
              value={b1}
              onChange={(e) => setB1(e.target.value)}
              placeholder="I’m grateful for…"
              autoFocus
            />
            <Input
              label="Blessing 2"
              value={b2}
              onChange={(e) => setB2(e.target.value)}
            />
            <Input
              label="Blessing 3"
              value={b3}
              onChange={(e) => setB3(e.target.value)}
            />
            <Textarea
              label="Biggest win"
              value={biggestWin}
              onChange={(e) => setBiggestWin(e.target.value)}
              rows={2}
            />
            <Textarea
              label="Lesson learned"
              value={lessonLearned}
              onChange={(e) => setLessonLearned(e.target.value)}
              rows={2}
            />
            <Textarea
              label="Tomorrow better"
              value={tomorrowBetter}
              onChange={(e) => setTomorrowBetter(e.target.value)}
              rows={2}
              placeholder="One thing I’ll do better tomorrow…"
            />
            <div className="flex justify-end pt-1">
              <Button type="submit" loading={busy}>
                <Heart className="size-4" />
                {todayEntry ? 'Update today' : 'Save today'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Past entries</CardTitle>
            <CalendarHeart className="size-4 text-gratitude" />
          </CardHeader>
          {past.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No past entries"
              description="Fill today’s form to start your gratitude archive."
              className="py-8"
            />
          ) : (
            <ul className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
              {past.map((entry, i) => (
                <motion.li
                  key={entry.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-3"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {formatDate(entry.date, 'MMM d, yyyy')}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Edit entry"
                        onClick={() => openEdit(entry)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete entry"
                        onClick={() => setToDelete(entry)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-0.5 text-sm text-text-muted">
                    {entry.items.slice(0, 3).map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                  </ul>
                  {entry.biggestWin ? (
                    <p className="mt-2 text-xs text-text-muted">
                      Win: {entry.biggestWin}
                    </p>
                  ) : null}
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={editOpen} onClose={closeEdit} title="Edit gratitude entry">
        {editing ? (
          <PastGratitudeForm
            key={editing.id}
            initial={editing}
            submitting={editBusy}
            onCancel={closeEdit}
            onSubmit={savePastEntry}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete gratitude entry?"
        message={`Permanently remove the entry from ${
          toDelete ? formatDate(toDelete.date, 'MMM d, yyyy') : 'this day'
        }?`}
        confirming={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function PastGratitudeForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: GratitudeEntry;
  submitting: boolean;
  onSubmit: (input: GratitudeFormInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial.date.slice(0, 10));
  const [b1, setB1] = useState(initial.items[0] ?? '');
  const [b2, setB2] = useState(initial.items[1] ?? '');
  const [b3, setB3] = useState(initial.items[2] ?? '');
  const [biggestWin, setBiggestWin] = useState(initial.biggestWin ?? '');
  const [lessonLearned, setLessonLearned] = useState(initial.lessonLearned ?? '');
  const [tomorrowBetter, setTomorrowBetter] = useState(
    initial.tomorrowBetter ?? '',
  );
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const items = [b1, b2, b3].map((s) => s.trim()).filter(Boolean);
    if (items.length < 3) {
      setError('Capture three blessings.');
      return;
    }
    await onSubmit({
      date,
      items,
      biggestWin: biggestWin.trim() || undefined,
      lessonLearned: lessonLearned.trim() || undefined,
      tomorrowBetter: tomorrowBetter.trim() || undefined,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input
        label="Blessing 1"
        value={b1}
        onChange={(e) => setB1(e.target.value)}
        error={error}
        autoFocus
      />
      <Input label="Blessing 2" value={b2} onChange={(e) => setB2(e.target.value)} />
      <Input label="Blessing 3" value={b3} onChange={(e) => setB3(e.target.value)} />
      <Textarea
        label="Biggest win"
        value={biggestWin}
        onChange={(e) => setBiggestWin(e.target.value)}
        rows={2}
      />
      <Textarea
        label="Lesson learned"
        value={lessonLearned}
        onChange={(e) => setLessonLearned(e.target.value)}
        rows={2}
      />
      <Textarea
        label="Tomorrow better"
        value={tomorrowBetter}
        onChange={(e) => setTomorrowBetter(e.target.value)}
        rows={2}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
