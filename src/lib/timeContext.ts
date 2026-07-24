import type { TimeSlot } from '@/types';

/** Active day-part (never `any`). */
export type ActiveTimeSlot = Exclude<TimeSlot, 'any'>;

export interface TimeContext {
  now: Date;
  hour: number;
  minute: number;
  slot: ActiveTimeSlot;
  /** Human label: "Dawn", "Good morning", etc. */
  label: string;
  /** Greeting stem: "Good morning", "Rise with the dawn", ... */
  greeting: string;
  dayOfYear: number;
  dayOfWeek: number;
  weekday: string;
  isWeekend: boolean;
  clockLabel: string;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date.getTime() -
    start.getTime() +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000;
  return Math.floor(diff / 86_400_000);
}

export function getTimeSlot(hour: number, minute = 0): ActiveTimeSlot {
  const t = hour + minute / 60;
  if (t >= 0 && t < 4) return 'late_night';
  if (t >= 4 && t < 6) return 'dawn';
  if (t >= 6 && t < 8) return 'early_morning';
  if (t >= 8 && t < 11) return 'morning';
  if (t >= 11 && t < 13) return 'midday';
  if (t >= 13 && t < 17) return 'afternoon';
  if (t >= 17 && t < 20) return 'evening';
  return 'night';
}

const SLOT_META: Record<ActiveTimeSlot, { label: string; greeting: string }> = {
  late_night: { label: 'Late night', greeting: 'Still grinding' },
  dawn: { label: 'Dawn', greeting: 'Rise with the dawn' },
  early_morning: { label: 'Early morning', greeting: 'Good morning' },
  morning: { label: 'Morning', greeting: 'Good morning' },
  midday: { label: 'Midday', greeting: 'Good afternoon' },
  afternoon: { label: 'Afternoon', greeting: 'Good afternoon' },
  evening: { label: 'Evening', greeting: 'Good evening' },
  night: { label: 'Night', greeting: 'Good night' },
};

export function getTimeContext(now = new Date()): TimeContext {
  const hour = now.getHours();
  const minute = now.getMinutes();
  const slot = getTimeSlot(hour, minute);
  const meta = SLOT_META[slot];
  const dayOfWeek = now.getDay();

  return {
    now,
    hour,
    minute,
    slot,
    label: meta.label,
    greeting: meta.greeting,
    dayOfYear: getDayOfYear(now),
    dayOfWeek,
    weekday: WEEKDAYS[dayOfWeek]!,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    clockLabel: now.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

/** Stable hash for deterministic quote picks. */
export function hashSeed(...parts: Array<string | number>): number {
  const raw = parts.join('|');
  let h = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
