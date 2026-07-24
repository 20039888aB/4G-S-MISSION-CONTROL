import { AnimatePresence, motion } from 'framer-motion';
import { Pin, Plus, Search, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '@/components/ui';
import {
  createNote,
  deleteNote,
  toggleNotePinned,
  updateNote,
  useNotesLive,
  type NoteInput,
} from '@/features/notes/hooks';
import { cn, formatRelative } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { G4Pillar, Note, NoteType } from '@/types';

const TYPE_OPTS: { value: NoteType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'idea', label: 'Idea' },
  { value: 'insight', label: 'Insight' },
  { value: 'decision', label: 'Decision' },
  { value: 'reminder', label: 'Reminder' },
];

const PILLAR_OPTS = [
  { value: '', label: 'No pillar' },
  { value: 'god', label: 'God' },
  { value: 'goals', label: 'Goals' },
  { value: 'grinding', label: 'Grinding' },
  { value: 'gratitude', label: 'Gratitude' },
];

function NoteForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: {
  initial?: Note | null;
  onSubmit: (input: NoteInput) => void | Promise<void>;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [body, setBody] = useState(initial?.body ?? '');
  const [type, setType] = useState<NoteType>(initial?.type ?? 'note');
  const [pillar, setPillar] = useState(initial?.pillar ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));
  const [pinned, setPinned] = useState(initial?.pinned ?? false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await onSubmit({
      title,
      body,
      type,
      pillar: (pillar || undefined) as G4Pillar | undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      pinned,
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
      <Textarea
        label="Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={6}
        placeholder="Capture the idea while it’s hot…"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as NoteType)}
          options={TYPE_OPTS}
        />
        <Select
          label="Pillar"
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          options={PILLAR_OPTS}
        />
      </div>
      <Input
        label="Tags"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        hint="Comma-separated"
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
          className="size-4"
        />
        Pin to top
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Create note'}
        </Button>
      </div>
    </form>
  );
}

export default function NotesPage() {
  const [query, setQuery] = useState('');
  const notes = useNotesLive(query);
  const addToast = useUiStore((s) => s.addToast);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [toDelete, setToDelete] = useState<Note | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(input: NoteInput) {
    setSubmitting(true);
    try {
      if (editing) {
        await updateNote(editing.id, input);
        addToast('success', 'Note updated');
      } else {
        await createNote(input);
        addToast('success', 'Note created');
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
        title="Notes Vault"
        description="Ideas, decisions, and mission insights — fully editable."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            New note
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
        />
      </div>

      {!notes ? null : notes.length === 0 ? (
        <EmptyState
          title="Vault is empty"
          description="Capture ideas from Quick Capture or create a note here."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Add note
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {notes.map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card glass className="flex h-full flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display font-semibold">{note.title}</h3>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {formatRelative(note.updatedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void toggleNotePinned(note)}
                      className={cn(
                        'rounded-md p-1.5',
                        note.pinned ? 'text-accent' : 'text-text-muted',
                      )}
                      aria-label={note.pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className="size-4" />
                    </button>
                  </div>
                  <p className="line-clamp-4 flex-1 text-sm text-text-muted">{note.body}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="accent">{note.type}</Badge>
                    {note.pillar ? <Badge>{note.pillar}</Badge> : null}
                    {note.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditing(note);
                        setOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Delete"
                      onClick={() => setToDelete(note)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit note' : 'New note'}
        size="lg"
      >
        <NoteForm
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

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete note?"
        message={`Remove “${toDelete?.title ?? ''}”? This cannot be undone.`}
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          await deleteNote(toDelete.id);
          setToDelete(null);
          addToast('success', 'Note deleted');
        }}
      />
    </div>
  );
}
