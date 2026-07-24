import { motion } from 'framer-motion';
import {
  BookMarked,
  CheckCircle2,
  Cross,
  Flame,
  NotebookPen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState, type FormEvent } from 'react';
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
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
} from '@/components/ui';
import { db } from '@/db/database';
import { formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type {
  BibleReading,
  PrayerLog,
  PrayerRequest,
  SpiritualEntry,
} from '@/types';

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function daysAgoKey(days: number) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function prayerStreak(logs: PrayerLog[]): number {
  const active = new Set(
    logs
      .filter((l) => l.morning || l.evening)
      .map((l) => l.date.slice(0, 10)),
  );
  let cursor = todayKey();
  if (!active.has(cursor)) cursor = daysAgoKey(1);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    if (!active.has(cursor)) break;
    streak += 1;
    const d = new Date(`${cursor}T12:00:00`);
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }
  return streak;
}

function splitPassage(passage: string): { book: string; chapters: string } {
  const trimmed = passage.trim();
  const match = trimmed.match(/^(.+?)\s+(\d.*)$/);
  if (match) return { book: match[1], chapters: match[2] };
  return { book: trimmed, chapters: '' };
}

type DeleteTarget =
  | { kind: 'prayer'; item: PrayerLog }
  | { kind: 'bible'; item: BibleReading }
  | { kind: 'journal'; item: SpiritualEntry }
  | { kind: 'request'; item: PrayerRequest };

export default function SpiritualPage() {
  const addToast = useUiStore((s) => s.addToast);
  const prayers = useLiveQuery(() => db.prayerLogs.toArray(), []);
  const readings = useLiveQuery(() => db.bibleReadings.toArray(), []);
  const journal = useLiveQuery(() => db.spiritualEntries.toArray(), []);
  const requests = useLiveQuery(() => db.prayerRequests.toArray(), []);

  const [prayerOpen, setPrayerOpen] = useState(false);
  const [bibleOpen, setBibleOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);

  const [editingPrayer, setEditingPrayer] = useState<PrayerLog | null>(null);
  const [editingBible, setEditingBible] = useState<BibleReading | null>(null);
  const [editingJournal, setEditingJournal] = useState<SpiritualEntry | null>(null);
  const [editingRequest, setEditingRequest] = useState<PrayerRequest | null>(null);

  const [toDelete, setToDelete] = useState<DeleteTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const streak = useMemo(() => prayerStreak(prayers ?? []), [prayers]);
  const readingsThisWeek = useMemo(() => {
    const start = daysAgoKey(6);
    return (readings ?? []).filter((r) => r.completed && r.date >= start).length;
  }, [readings]);

  const sortedPrayers = useMemo(
    () => [...(prayers ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [prayers],
  );
  const sortedReadings = useMemo(
    () => [...(readings ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [readings],
  );
  const sortedJournal = useMemo(
    () =>
      [...(journal ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30),
    [journal],
  );
  const sortedRequests = useMemo(
    () =>
      [...(requests ?? [])].sort((a, b) => {
        if (a.answered !== b.answered) return a.answered ? 1 : -1;
        return b.updatedAt.localeCompare(a.updatedAt);
      }),
    [requests],
  );

  function closePrayer() {
    setPrayerOpen(false);
    setEditingPrayer(null);
  }
  function closeBible() {
    setBibleOpen(false);
    setEditingBible(null);
  }
  function closeJournal() {
    setJournalOpen(false);
    setEditingJournal(null);
  }
  function closeRequest() {
    setRequestOpen(false);
    setEditingRequest(null);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      switch (toDelete.kind) {
        case 'prayer':
          await db.prayerLogs.delete(toDelete.item.id);
          addToast('success', 'Prayer log removed.');
          break;
        case 'bible':
          await db.bibleReadings.delete(toDelete.item.id);
          addToast('success', 'Reading removed.');
          break;
        case 'journal':
          await db.spiritualEntries.delete(toDelete.item.id);
          addToast('success', 'Entry removed.');
          break;
        case 'request':
          await db.prayerRequests.delete(toDelete.item.id);
          addToast('success', 'Request removed.');
          break;
      }
      setToDelete(null);
    } catch {
      addToast('danger', 'Could not delete.');
    } finally {
      setDeleting(false);
    }
  }

  const deleteMessage = (() => {
    if (!toDelete) return '';
    switch (toDelete.kind) {
      case 'prayer':
        return `Remove prayer log for ${formatDate(toDelete.item.date)}?`;
      case 'bible':
        return `Remove reading “${toDelete.item.passage}”?`;
      case 'journal':
        return `Remove journal entry “${toDelete.item.title}”?`;
      case 'request':
        return `Remove prayer request “${toDelete.item.title}”?`;
    }
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="God"
        title="Spiritual"
        description="Prayer, Word, journal, and requests — stay rooted."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Prayer streak"
          value={`${streak}d`}
          hint="Consecutive prayer days"
          icon={Flame}
          glass
          accentClassName="bg-god/15 text-god"
        />
        <StatCard
          label="Readings this week"
          value={readingsThisWeek}
          hint="Completed passages"
          icon={BookMarked}
          accentClassName="bg-god/15 text-god"
        />
      </div>

      <Tabs defaultValue="prayer">
        <TabsList className="flex-wrap">
          <TabsTrigger value="prayer">Prayer</TabsTrigger>
          <TabsTrigger value="bible">Bible</TabsTrigger>
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="prayer">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingPrayer(null);
                setPrayerOpen(true);
              }}
            >
              <Plus className="size-4" />
              Log prayer
            </Button>
          </div>
          {sortedPrayers.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={Cross}
                title="No prayer logs yet"
                description="Start a morning or evening rhythm."
                action={
                  <Button
                    onClick={() => {
                      setEditingPrayer(null);
                      setPrayerOpen(true);
                    }}
                  >
                    <Plus className="size-4" />
                    Log prayer
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedPrayers.map((log) => (
                <Card key={log.id} padding="sm" className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{formatDate(log.date)}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {log.morning ? <Badge tone="god">Morning</Badge> : null}
                      {log.evening ? <Badge tone="accent">Evening</Badge> : null}
                    </div>
                    {log.notes ? (
                      <p className="mt-1 text-sm text-text-muted line-clamp-2">
                        {log.notes}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit prayer log"
                      onClick={() => {
                        setEditingPrayer(log);
                        setPrayerOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete prayer log"
                      onClick={() => setToDelete({ kind: 'prayer', item: log })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bible">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingBible(null);
                setBibleOpen(true);
              }}
            >
              <Plus className="size-4" />
              Log reading
            </Button>
          </div>
          {sortedReadings.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={BookMarked}
                title="No Bible readings"
                description="Track book, chapters, and reflections."
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedReadings.map((reading) => (
                <Card key={reading.id} padding="sm" className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{reading.passage}</p>
                      {reading.completed ? (
                        <Badge tone="success">Done</Badge>
                      ) : (
                        <Badge tone="warning">Open</Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      {formatDate(reading.date)}
                    </p>
                    {reading.reflection ? (
                      <p className="mt-1 text-sm text-text-muted line-clamp-2">
                        {reading.reflection}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Edit reading"
                      onClick={() => {
                        setEditingBible(reading);
                        setBibleOpen(true);
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete reading"
                      onClick={() => setToDelete({ kind: 'bible', item: reading })}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="journal">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingJournal(null);
                setJournalOpen(true);
              }}
            >
              <Plus className="size-4" />
              New entry
            </Button>
          </div>
          {sortedJournal.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={NotebookPen}
                title="Faith journal is empty"
                description="Write what God is teaching you."
              />
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedJournal.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Card glass className="h-full">
                    <CardHeader>
                      <div>
                        <CardTitle className="text-base">{entry.title}</CardTitle>
                        <p className="text-xs text-text-muted">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Edit entry"
                          onClick={() => {
                            setEditingJournal(entry);
                            setJournalOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label="Delete entry"
                          onClick={() => setToDelete({ kind: 'journal', item: entry })}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <p className="text-sm text-text-muted line-clamp-4 whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <div className="mb-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setEditingRequest(null);
                setRequestOpen(true);
              }}
            >
              <Plus className="size-4" />
              Add request
            </Button>
          </div>
          {sortedRequests.length === 0 ? (
            <Card glass>
              <EmptyState
                icon={CheckCircle2}
                title="No prayer requests"
                description="Lift people and needs — mark them answered when God moves."
              />
            </Card>
          ) : (
            <div className="space-y-2">
              {sortedRequests.map((req) => (
                <Card key={req.id} padding="sm" className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{req.title}</p>
                      {req.details ? (
                        <p className="mt-1 text-sm text-text-muted">{req.details}</p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Edit request"
                        onClick={() => {
                          setEditingRequest(req);
                          setRequestOpen(true);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete request"
                        onClick={() => setToDelete({ kind: 'request', item: req })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Toggle
                    checked={req.answered}
                    label={req.answered ? 'Answered' : 'Still praying'}
                    onChange={async (answered) => {
                      const now = new Date().toISOString();
                      await db.prayerRequests.update(req.id, {
                        answered,
                        answeredAt: answered ? now : undefined,
                        updatedAt: now,
                      });
                    }}
                  />
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Modal
        open={prayerOpen}
        onClose={closePrayer}
        title={editingPrayer ? 'Edit prayer log' : 'Log prayer'}
      >
        <PrayerForm
          key={editingPrayer?.id ?? 'new-prayer'}
          initial={editingPrayer}
          submitting={busy}
          onCancel={closePrayer}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (editingPrayer) {
                await db.prayerLogs.update(editingPrayer.id, input);
                addToast('success', 'Prayer log updated.');
              } else {
                const existing = await db.prayerLogs
                  .where('date')
                  .equals(input.date)
                  .first();
                if (existing) {
                  await db.prayerLogs.update(existing.id, {
                    morning: existing.morning || input.morning,
                    evening: existing.evening || input.evening,
                    notes: input.notes || existing.notes,
                  });
                } else {
                  await db.prayerLogs.add({
                    id: uid(),
                    ...input,
                    createdAt: new Date().toISOString(),
                  });
                }
                addToast('success', 'Prayer logged.');
              }
              closePrayer();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={bibleOpen}
        onClose={closeBible}
        title={editingBible ? 'Edit Bible reading' : 'Log Bible reading'}
      >
        <BibleForm
          key={editingBible?.id ?? 'new-bible'}
          initial={editingBible}
          submitting={busy}
          onCancel={closeBible}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              if (editingBible) {
                await db.bibleReadings.update(editingBible.id, input);
                addToast('success', 'Reading updated.');
              } else {
                await db.bibleReadings.add({
                  id: uid(),
                  ...input,
                  createdAt: new Date().toISOString(),
                });
                addToast('success', 'Reading logged.');
              }
              closeBible();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={journalOpen}
        onClose={closeJournal}
        title={editingJournal ? 'Edit faith journal' : 'Faith journal'}
      >
        <FaithJournalForm
          key={editingJournal?.id ?? 'new-journal'}
          initial={editingJournal}
          submitting={busy}
          onCancel={closeJournal}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              const now = new Date().toISOString();
              if (editingJournal) {
                await db.spiritualEntries.update(editingJournal.id, {
                  ...input,
                  updatedAt: now,
                });
                addToast('success', 'Entry updated.');
              } else {
                await db.spiritualEntries.add({
                  id: uid(),
                  ...input,
                  tags: [],
                  createdAt: now,
                  updatedAt: now,
                });
                addToast('success', 'Entry saved.');
              }
              closeJournal();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <Modal
        open={requestOpen}
        onClose={closeRequest}
        title={editingRequest ? 'Edit prayer request' : 'Prayer request'}
      >
        <RequestForm
          key={editingRequest?.id ?? 'new-request'}
          initial={editingRequest}
          submitting={busy}
          onCancel={closeRequest}
          onSubmit={async (input) => {
            setBusy(true);
            try {
              const now = new Date().toISOString();
              if (editingRequest) {
                const answeredChanged = input.answered !== editingRequest.answered;
                await db.prayerRequests.update(editingRequest.id, {
                  title: input.title,
                  details: input.details,
                  answered: input.answered,
                  answeredAt: input.answered
                    ? answeredChanged || !editingRequest.answeredAt
                      ? now
                      : editingRequest.answeredAt
                    : undefined,
                  updatedAt: now,
                });
                addToast('success', 'Request updated.');
              } else {
                await db.prayerRequests.add({
                  id: uid(),
                  title: input.title,
                  details: input.details,
                  answered: false,
                  createdAt: now,
                  updatedAt: now,
                });
                addToast('success', 'Request added.');
              }
              closeRequest();
            } finally {
              setBusy(false);
            }
          }}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete?"
        message={deleteMessage}
        confirming={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function PrayerForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: PrayerLog | null;
  submitting: boolean;
  onSubmit: (input: Omit<PrayerLog, 'id' | 'createdAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [morning, setMorning] = useState(initial?.morning ?? true);
  const [evening, setEvening] = useState(initial?.evening ?? false);
  const [notes, setNotes] = useState(initial?.notes ?? '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!morning && !evening) return;
    await onSubmit({ date, morning, evening, notes: notes.trim() || undefined });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Toggle checked={morning} onChange={setMorning} label="Morning prayer" />
      <Toggle checked={evening} onChange={setEvening} label="Evening prayer" />
      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting} disabled={!morning && !evening}>
          {initial ? 'Save' : 'Log'}
        </Button>
      </div>
    </form>
  );
}

function BibleForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: BibleReading | null;
  submitting: boolean;
  onSubmit: (input: Omit<BibleReading, 'id' | 'createdAt'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const parts = initial ? splitPassage(initial.passage) : null;
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [book, setBook] = useState(parts?.book ?? '');
  const [chapters, setChapters] = useState(parts?.chapters ?? '');
  const [reflection, setReflection] = useState(initial?.reflection ?? '');
  const [completed, setCompleted] = useState(initial?.completed ?? true);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!book.trim()) {
      setError('Book is required');
      return;
    }
    const passage = chapters.trim()
      ? `${book.trim()} ${chapters.trim()}`
      : book.trim();
    await onSubmit({
      date,
      passage,
      completed,
      reflection: reflection.trim() || undefined,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input
        label="Book"
        value={book}
        onChange={(e) => setBook(e.target.value)}
        placeholder="e.g. John"
        error={error}
        autoFocus
      />
      <Input
        label="Chapters"
        value={chapters}
        onChange={(e) => setChapters(e.target.value)}
        placeholder="e.g. 1–3"
      />
      <Toggle checked={completed} onChange={setCompleted} label="Completed" />
      <Textarea
        label="Reflection"
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        rows={3}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{initial ? 'Save' : 'Log'}</Button>
      </div>
    </form>
  );
}

function FaithJournalForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: SpiritualEntry | null;
  submitting: boolean;
  onSubmit: (input: Pick<SpiritualEntry, 'date' | 'title' | 'content'>) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date.slice(0, 10) ?? todayKey());
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    await onSubmit({ date, title: title.trim(), content: content.trim() });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Entry"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>{initial ? 'Save' : 'Save'}</Button>
      </div>
    </form>
  );
}

function RequestForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: PrayerRequest | null;
  submitting: boolean;
  onSubmit: (input: {
    title: string;
    details?: string;
    answered: boolean;
  }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [details, setDetails] = useState(initial?.details ?? '');
  const [answered, setAnswered] = useState(initial?.answered ?? false);
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    await onSubmit({
      title: title.trim(),
      details: details.trim() || undefined,
      answered,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Request"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Details"
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
      />
      {initial ? (
        <Toggle
          checked={answered}
          onChange={setAnswered}
          label={answered ? 'Answered' : 'Still praying'}
        />
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
