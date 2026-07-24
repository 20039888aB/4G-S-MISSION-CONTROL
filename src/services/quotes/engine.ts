import { QUOTE_CATALOG } from '@/data/quotes/catalog';
import {
  getTimeContext,
  hashSeed,
  type TimeContext,
} from '@/lib/timeContext';
import type { Quote, TimeSlot } from '@/types';

export interface QuotePick {
  quote: Quote;
  context: TimeContext;
  poolSize: number;
}

function matchesSlot(quote: Quote, slot: TimeSlot): boolean {
  const slots = quote.slots?.length ? quote.slots : (['any'] as TimeSlot[]);
  return slots.includes('any') || slots.includes(slot);
}

/** Deterministic quote for a given moment — stable within the same day-part. */
export function selectQuoteForDate(
  quotes: Quote[],
  now = new Date(),
): QuotePick {
  const context = getTimeContext(now);
  const library = quotes.length > 0 ? quotes : (QUOTE_CATALOG as Quote[]);

  const pool = library.filter((q) => matchesSlot(q, context.slot));
  const usable = pool.length > 0 ? pool : library;

  // Hour bucket keeps the quote stable for ~2 hours, then rotates naturally.
  const hourBucket = Math.floor(context.hour / 2);
  const seed = hashSeed(
    context.dayOfYear,
    context.weekday,
    context.slot,
    hourBucket,
    usable.length,
  );
  const quote = usable[seed % usable.length]!;

  return { quote, context, poolSize: usable.length };
}

export function formatGreeting(name: string | null | undefined, now = new Date()) {
  const context = getTimeContext(now);
  const first = name?.trim().split(/\s+/)[0] || 'Operator';
  return {
    ...context,
    line: `${context.greeting}, ${first}`,
    subline: `${context.weekday} · ${context.label} · ${context.clockLabel}`,
  };
}
