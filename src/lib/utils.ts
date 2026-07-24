import { clsx, type ClassValue } from 'clsx';
import {
  format,
  formatDistanceToNow,
  isValid,
  parseISO,
} from 'date-fns';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = 'KES',
  locale = 'en-KE',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

function toDate(value: string | Date | number): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : new Date(value);
}

export function formatDate(
  value: string | Date | number,
  pattern = 'MMM d, yyyy',
): string {
  const date = toDate(value);
  if (!isValid(date)) return '—';
  return format(date, pattern);
}

export function formatRelative(value: string | Date | number): string {
  const date = toDate(value);
  if (!isValid(date)) return '—';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function uid(): string {
  return crypto.randomUUID();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function percent(value: number, total: number, digits = 0): number {
  if (total <= 0) return 0;
  const raw = (value / total) * 100;
  const factor = 10 ** digits;
  return Math.round(raw * factor) / factor;
}
