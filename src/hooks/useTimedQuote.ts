import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/db/database';
import {
  formatGreeting,
  selectQuoteForDate,
  type QuotePick,
} from '@/services/quotes/engine';
import { useAuthStore } from '@/stores/authStore';

/** Live clock + time-aware quote that refreshes every minute. */
export function useTimedQuote() {
  const displayName = useAuthStore((s) => s.displayName);
  const [now, setNow] = useState(() => new Date());
  const quotes = useLiveQuery(() => db.quotes.toArray(), []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const pick: QuotePick | null = useMemo(() => {
    if (!quotes) return null;
    return selectQuoteForDate(quotes, now);
  }, [quotes, now]);

  const greeting = useMemo(
    () => formatGreeting(displayName, now),
    [displayName, now],
  );

  return {
    now,
    quote: pick?.quote ?? null,
    context: pick?.context ?? null,
    poolSize: pick?.poolSize ?? 0,
    greeting,
    loading: quotes === undefined,
  };
}
