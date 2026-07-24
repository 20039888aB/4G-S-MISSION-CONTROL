import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { motion } from 'framer-motion';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
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
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import { db } from '@/db/database';
import { cn, formatDate, uid } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { CalendarEvent, CalendarEventType } from '@/types';

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'event', label: 'Event' },
  { value: 'birthday', label: 'Birthday' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'personal', label: 'Personal' },
  { value: 'other', label: 'Other' },
];

type EventFormInput = {
  title: string;
  description?: string;
  type: CalendarEventType;
  date: string;
  time: string;
  recurringWeekly: boolean;
};

function dayKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

function eventToFormDefaults(event: CalendarEvent): EventFormInput {
  const start = parseISO(event.start);
  return {
    title: event.title,
    description: event.description ?? '',
    type: event.type,
    date: event.start.slice(0, 10),
    time: event.allDay ? '' : format(start, 'HH:mm'),
    recurringWeekly: Boolean(event.recurringWeekly),
  };
}

export default function CalendarPage() {
  const addToast = useUiStore((s) => s.addToast);
  const events = useLiveQuery(() => db.calendarEvents.toArray(), []);
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(() => new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [toDelete, setToDelete] = useState<CalendarEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events ?? []) {
      const key = event.start.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const selectedKey = dayKey(selected);
  const dayEvents = useMemo(
    () =>
      [...(byDay.get(selectedKey) ?? [])].sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    [byDay, selectedKey],
  );

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(event: CalendarEvent) {
    setEditing(event);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setEditing(null);
  }

  async function saveEvent(input: EventFormInput) {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const start = input.time
        ? `${input.date}T${input.time}:00`
        : `${input.date}T09:00:00`;
      const endDate = new Date(start);
      endDate.setHours(endDate.getHours() + 1);
      const payload = {
        title: input.title.trim(),
        description: input.description?.trim() || undefined,
        type: input.type,
        start,
        end: endDate.toISOString(),
        allDay: !input.time,
        recurringWeekly: input.recurringWeekly,
        updatedAt: now,
      };

      if (editing) {
        await db.calendarEvents.update(editing.id, payload);
        addToast('success', 'Event updated.');
      } else {
        await db.calendarEvents.add({
          id: uid(),
          ...payload,
          createdAt: now,
        });
        addToast('success', 'Event added.');
      }
      closeModal();
    } catch {
      addToast('danger', editing ? 'Could not update event.' : 'Could not add event.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await db.calendarEvents.delete(toDelete.id);
      addToast('success', 'Event removed.');
      setToDelete(null);
    } catch {
      addToast('danger', 'Could not remove event.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mission"
        title="Calendar"
        description="Month view for tasks, events, birthdays, and deadlines."
        actions={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add event
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glass className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{format(cursor, 'MMMM yyyy')}</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCursor((c) => addMonths(c, -1))}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const now = new Date();
                  setCursor(startOfMonth(now));
                  setSelected(now);
                }}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setCursor((c) => addMonths(c, 1))}
              >
                Next
              </Button>
            </div>
          </CardHeader>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-text-muted uppercase">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = dayKey(day);
              const count = byDay.get(key)?.length ?? 0;
              const inMonth = isSameMonth(day, cursor);
              const isSelected = isSameDay(day, selected);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(day)}
                  className={cn(
                    'relative flex min-h-16 flex-col rounded-[var(--radius-md)] border p-1.5 text-left transition',
                    inMonth
                      ? 'border-border bg-bg/30 hover:border-accent/40'
                      : 'border-transparent bg-transparent text-text-muted/50',
                    isSelected && 'border-accent bg-accent-soft/40',
                    isToday && !isSelected && 'ring-1 ring-accent/50',
                  )}
                >
                  <span className="text-xs font-semibold">{format(day, 'd')}</span>
                  {count > 0 ? (
                    <span className="mt-auto flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                        <span
                          key={i}
                          className="size-1.5 rounded-full bg-accent"
                        />
                      ))}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">
                {formatDate(selected, 'EEEE, MMM d')}
              </CardTitle>
              <p className="text-xs text-text-muted">
                {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={openCreate}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </CardHeader>

          {dayEvents.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nothing scheduled"
              description="Click a day, then add an event."
              className="py-8"
            />
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((event, i) => (
                <motion.li
                  key={event.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-[var(--radius-md)] border border-border bg-bg/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-text-muted">
                        {event.allDay
                          ? 'All day'
                          : format(parseISO(event.start), 'HH:mm')}
                        {event.recurringWeekly ? ' · Weekly' : ''}
                      </p>
                      <div className="mt-1">
                        <Badge tone="accent">{event.type}</Badge>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Edit event"
                        onClick={() => openEdit(event)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label="Delete event"
                        onClick={() => setToDelete(event)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title={editing ? 'Edit event' : 'Add event'}
      >
        <EventForm
          key={editing?.id ?? `new-${selectedKey}`}
          initial={editing ? eventToFormDefaults(editing) : undefined}
          defaultDate={selectedKey}
          submitting={busy}
          onCancel={closeModal}
          onSubmit={saveEvent}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete event?"
        message={`Permanently remove “${toDelete?.title ?? 'this event'}”?`}
        confirming={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function EventForm({
  initial,
  defaultDate,
  submitting,
  onSubmit,
  onCancel,
}: {
  initial?: EventFormInput;
  defaultDate: string;
  submitting: boolean;
  onSubmit: (input: EventFormInput) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [type, setType] = useState<CalendarEventType>(initial?.type ?? 'event');
  const [date, setDate] = useState(initial?.date ?? defaultDate);
  const [time, setTime] = useState(initial?.time ?? '09:00');
  const [recurringWeekly, setRecurringWeekly] = useState(
    initial?.recurringWeekly ?? false,
  );
  const [error, setError] = useState<string>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    await onSubmit({
      title,
      description,
      type,
      date,
      time,
      recurringWeekly,
    });
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        label="Title"
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
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as CalendarEventType)}
        options={EVENT_TYPES}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          label="Time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <Toggle
        checked={recurringWeekly}
        onChange={setRecurringWeekly}
        label="Recurring weekly"
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Add event'}
        </Button>
      </div>
    </form>
  );
}
