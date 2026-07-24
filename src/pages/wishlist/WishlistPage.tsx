import { motion } from 'framer-motion';
import { Gift, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Progress,
  Select,
  Textarea,
} from '@/components/ui';
import { db } from '@/db/database';
import { cn, formatCurrency, percent, uid } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import type { TaskPriority, WishlistItem, WishlistStatus } from '@/types';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const PRIORITY_OPTS: { value: TaskPriority; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTS: { value: WishlistStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'planned', label: 'Planned' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'dropped', label: 'Dropped' },
];

type WishlistInput = {
  title: string;
  description?: string;
  estimatedCost?: number;
  savedAmount?: number;
  priority: TaskPriority;
  status: WishlistStatus;
  url?: string;
  imageUrl?: string;
  notes?: string;
  currency?: string;
};

async function upsertItem(id: string | null, input: WishlistInput, currency: string) {
  const now = new Date().toISOString();
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    estimatedCost: input.estimatedCost,
    savedAmount: input.savedAmount ?? 0,
    currency: input.currency ?? currency,
    priority: input.priority,
    status: input.status,
    url: input.url?.trim() || undefined,
    imageUrl: input.imageUrl?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    updatedAt: now,
  };

  if (id) {
    await db.wishlist.update(id, payload);
    return id;
  }
  const newId = uid();
  await db.wishlist.add({
    id: newId,
    ...payload,
    createdAt: now,
  });
  return newId;
}

export default function WishlistPage() {
  const currency = useSettingsStore((s) => s.currency);
  const addToast = useUiStore((s) => s.addToast);
  const items = useLiveQuery(() => db.wishlist.toArray(), []);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WishlistItem | null>(null);
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(
    () =>
      [...(items ?? [])].sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          b.updatedAt.localeCompare(a.updatedAt),
      ),
    [items],
  );

  async function onSave(input: WishlistInput) {
    setBusy(true);
    try {
      await upsertItem(editing?.id ?? null, input, currency);
      addToast('success', editing ? 'Wish updated.' : 'Wish added.');
      setOpen(false);
      setEditing(null);
    } catch {
      addToast('danger', 'Could not save wish.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Goals"
        title="Wishlist"
        description="Dreams with a price tag — save with intention."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" />
            Add wish
          </Button>
        }
      />

      {sorted.length === 0 ? (
        <Card glass>
          <EmptyState
            icon={Gift}
            title="Wishlist is empty"
            description="Add something worth grinding for — and track the savings climb."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add wish
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((item, i) => {
            const cost = item.estimatedCost ?? 0;
            const saved = item.savedAmount ?? 0;
            const pct = cost > 0 ? percent(saved, cost) : 0;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card glass className="flex h-full flex-col overflow-hidden p-0">
                  {item.imageUrl ? (
                    <div
                      className="h-36 bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.imageUrl})` }}
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-[radial-gradient(circle_at_top,rgba(240,180,41,0.18),transparent_60%)]">
                      <Gift className="size-8 text-accent/70" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <CardHeader className="mb-2">
                      <div>
                        <CardTitle className="text-base">{item.title}</CardTitle>
                        <p className="text-sm font-medium text-accent">
                          {cost
                            ? formatCurrency(cost, item.currency || currency)
                            : 'Price TBD'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          tone={
                            item.priority === 'urgent' || item.priority === 'high'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {item.priority}
                        </Badge>
                        <Badge tone="accent">{item.status}</Badge>
                      </div>
                    </CardHeader>
                    {item.notes ? (
                      <p className="mb-3 text-sm italic text-text-muted line-clamp-2">
                        “{item.notes}”
                      </p>
                    ) : null}
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between text-xs text-text-muted">
                        <span>Savings progress</span>
                        <span>
                          {formatCurrency(saved, item.currency || currency)} · {pct}%
                        </span>
                      </div>
                      <Progress value={pct} />
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(item);
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
                            await db.wishlist.delete(item.id);
                            addToast('success', 'Wish removed.');
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit wish' : 'Add wish'}
        size="lg"
      >
        <WishlistForm
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

function WishlistForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial: WishlistItem | null;
  submitting: boolean;
  onSubmit: (input: WishlistInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [estimatedCost, setEstimatedCost] = useState(
    initial?.estimatedCost != null ? String(initial.estimatedCost) : '',
  );
  const [savedAmount, setSavedAmount] = useState(
    String(initial?.savedAmount ?? 0),
  );
  const [priority, setPriority] = useState<TaskPriority>(
    initial?.priority ?? 'medium',
  );
  const [status, setStatus] = useState<WishlistStatus>(initial?.status ?? 'idea');
  const [url, setUrl] = useState(initial?.url ?? '');
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Name is required');
      return;
    }
    await onSubmit({
      title,
      description,
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      savedAmount: Number(savedAmount) || 0,
      priority,
      status,
      url,
      imageUrl,
      notes,
    });
  }

  return (
    <form className={cn('space-y-3')} onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={error}
        autoFocus
      />
      <Textarea
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Price"
          type="number"
          min={0}
          value={estimatedCost}
          onChange={(e) => setEstimatedCost(e.target.value)}
        />
        <Input
          label="Saved so far"
          type="number"
          min={0}
          value={savedAmount}
          onChange={(e) => setSavedAmount(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          options={PRIORITY_OPTS}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as WishlistStatus)}
          options={STATUS_OPTS}
        />
      </div>
      <Input
        label="Product URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://"
      />
      <Input
        label="Image URL"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="https://"
      />
      <Textarea
        label="Motivational note"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Why this matters…"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save' : 'Add'}
        </Button>
      </div>
    </form>
  );
}
