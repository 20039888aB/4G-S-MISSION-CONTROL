import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import type { HabitInput } from '@/features/habits/hooks';
import type { G4Pillar, Habit, HabitFrequency } from '@/types';

const PILLAR_OPTIONS = [
  { value: '', label: 'No pillar' },
  { value: 'god', label: 'God' },
  { value: 'goals', label: 'Goals' },
  { value: 'grinding', label: 'Grinding' },
  { value: 'gratitude', label: 'Gratitude' },
];

const FREQUENCY_OPTIONS: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
];

const EMOJI_PRESETS = ['✨', '🔥', '💪', '📖', '🙏', '💧', '🧘', '🌅', '🥗', '⚡'];

export interface HabitFormProps {
  initial?: Habit | null;
  submitting?: boolean;
  onSubmit: (input: HabitInput) => void | Promise<void>;
  onCancel: () => void;
}

export function HabitForm({
  initial,
  submitting = false,
  onSubmit,
  onCancel,
}: HabitFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '✨');
  const [pillar, setPillar] = useState<string>(initial?.pillar ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>(
    initial?.frequency ?? 'daily',
  );
  const [error, setError] = useState<string>();

  useEffect(() => {
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setIcon(initial?.icon ?? '✨');
    setPillar(initial?.pillar ?? '');
    setFrequency(initial?.frequency ?? 'daily');
    setError(undefined);
  }, [initial]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      icon: icon.trim() || '✨',
      pillar: (pillar || undefined) as G4Pillar | undefined,
      frequency,
      targetPerDay: initial?.targetPerDay ?? 1,
      color: initial?.color ?? '#F0B429',
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Morning prayer"
        error={error}
        autoFocus
      />
      <Textarea
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Why this habit matters…"
        rows={3}
      />
      <div className="space-y-2">
        <Input
          label="Icon (emoji or label)"
          name="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          placeholder="✨"
        />
        <div className="flex flex-wrap gap-1.5">
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface text-base transition hover:border-accent"
              onClick={() => setIcon(emoji)}
              aria-label={`Use ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          label="Category (pillar)"
          name="pillar"
          value={pillar}
          onChange={(e) => setPillar(e.target.value)}
          options={PILLAR_OPTIONS}
        />
        <Select
          label="Frequency"
          name="frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as HabitFrequency)}
          options={FREQUENCY_OPTIONS}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Add habit'}
        </Button>
      </div>
    </form>
  );
}
