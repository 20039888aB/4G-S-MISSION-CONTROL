import { Pencil } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import {
  createHealthMetric,
  todayKey,
  updateHealthMetric,
} from '@/features/health/hooks';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/stores/uiStore';
import type { HealthMetric } from '@/types';

export type QuickMetricKey =
  | 'weightKg'
  | 'bp'
  | 'heartRate'
  | 'spo2Pct'
  | 'temperatureC'
  | 'bloodSugar'
  | 'sleepHours'
  | 'waterMl'
  | 'steps';

const LABELS: Record<QuickMetricKey, string> = {
  weightKg: 'Weight',
  bp: 'Blood pressure',
  heartRate: 'Heart rate',
  spo2Pct: 'SpO₂',
  temperatureC: 'Temp °C',
  bloodSugar: 'Blood sugar',
  sleepHours: 'Sleep',
  waterMl: 'Water',
  steps: 'Steps',
};

export function QuickMetricTile({
  metricKey,
  label,
  value,
  unit,
  latest,
  onSaved,
}: {
  metricKey: QuickMetricKey;
  label?: string;
  value: string;
  unit?: string;
  latest?: HealthMetric | null;
  onSaved?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group rounded-[var(--radius-md)] border border-border bg-surface/60 px-3 py-2.5 text-left transition',
          'hover:border-accent/50 hover:bg-accent-soft/30',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
            {label ?? LABELS[metricKey]}
          </p>
          <Pencil className="size-3 text-accent opacity-60 group-hover:opacity-100" />
        </div>
        <p className="mt-1 font-display text-xl font-semibold text-text">
          {value}
          {unit ? (
            <span className="ml-1 text-xs font-normal text-text-muted">{unit}</span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[10px] text-accent">Tap to edit</p>
      </button>
      <QuickMetricModal
        open={open}
        onClose={() => setOpen(false)}
        metricKey={metricKey}
        latest={latest}
        onSaved={() => {
          setOpen(false);
          onSaved?.();
        }}
      />
    </>
  );
}

export function QuickMetricModal({
  open,
  onClose,
  metricKey,
  latest,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  metricKey: QuickMetricKey;
  latest?: HealthMetric | null;
  onSaved?: () => void;
}) {
  const addToast = useUiStore((s) => s.addToast);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(todayKey());
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(latest?.date.slice(0, 10) ?? todayKey());
    if (metricKey === 'bp') {
      setPrimary(String(latest?.bloodPressureSystolic ?? ''));
      setSecondary(String(latest?.bloodPressureDiastolic ?? ''));
    } else if (metricKey === 'weightKg') setPrimary(String(latest?.weightKg ?? ''));
    else if (metricKey === 'heartRate') setPrimary(String(latest?.heartRate ?? ''));
    else if (metricKey === 'spo2Pct') setPrimary(String(latest?.spo2Pct ?? ''));
    else if (metricKey === 'temperatureC') setPrimary(String(latest?.temperatureC ?? ''));
    else if (metricKey === 'bloodSugar') setPrimary(String(latest?.bloodSugar ?? ''));
    else if (metricKey === 'sleepHours') setPrimary(String(latest?.sleepHours ?? ''));
    else if (metricKey === 'waterMl') setPrimary(String(latest?.waterMl ?? ''));
    else if (metricKey === 'steps') setPrimary(String(latest?.steps ?? ''));
  }, [open, metricKey, latest]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const n = Number(primary);
      const n2 = Number(secondary);
      const base = {
        date,
        sleepHours: latest?.sleepHours,
        waterMl: latest?.waterMl,
        steps: latest?.steps,
        energy: latest?.energy,
        mood: latest?.mood,
        weightKg: latest?.weightKg,
        bloodPressureSystolic: latest?.bloodPressureSystolic,
        bloodPressureDiastolic: latest?.bloodPressureDiastolic,
        heartRate: latest?.heartRate,
        spo2Pct: latest?.spo2Pct,
        temperatureC: latest?.temperatureC,
        bloodSugar: latest?.bloodSugar,
        calories: latest?.calories,
        proteinG: latest?.proteinG,
        carbsG: latest?.carbsG,
        fatG: latest?.fatG,
        notes: latest?.notes,
      };

      if (metricKey === 'bp') {
        if (!Number.isFinite(n) || !Number.isFinite(n2)) {
          addToast('warning', 'Enter systolic and diastolic.');
          return;
        }
        base.bloodPressureSystolic = n;
        base.bloodPressureDiastolic = n2;
      } else {
        if (!Number.isFinite(n)) {
          addToast('warning', 'Enter a valid number.');
          return;
        }
        if (metricKey === 'weightKg') base.weightKg = n;
        if (metricKey === 'heartRate') base.heartRate = n;
        if (metricKey === 'spo2Pct') base.spo2Pct = n;
        if (metricKey === 'temperatureC') base.temperatureC = n;
        if (metricKey === 'bloodSugar') base.bloodSugar = n;
        if (metricKey === 'sleepHours') base.sleepHours = n;
        if (metricKey === 'waterMl') base.waterMl = n;
        if (metricKey === 'steps') base.steps = n;
      }

      const sameDay =
        latest && latest.date.slice(0, 10) === date.slice(0, 10) ? latest : null;
      if (sameDay) await updateHealthMetric(sameDay.id, base);
      else await createHealthMetric(base);

      addToast('success', `${LABELS[metricKey]} updated`);
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit ${LABELS[metricKey]}`}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        {metricKey === 'bp' ? (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Systolic"
              type="number"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              required
            />
            <Input
              label="Diastolic"
              type="number"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              required
            />
          </div>
        ) : (
          <Input
            label={LABELS[metricKey]}
            type="number"
            step="any"
            value={primary}
            onChange={(e) => setPrimary(e.target.value)}
            required
          />
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
