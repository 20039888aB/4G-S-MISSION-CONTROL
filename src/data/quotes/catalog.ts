import catalogJson from '@/data/quotes/catalog.json';
import type { G4Pillar, Quote, TimeSlot } from '@/types';

export type QuoteSeed = Omit<Quote, 'id'> & { id: string };

interface RawQuote {
  id: string;
  text: string;
  author: string;
  pillar?: G4Pillar;
  slots: Array<TimeSlot | 'any'>;
  tags: string[];
}

const raw = catalogJson as RawQuote[];

/** Full library (~1000+) used for seeding and offline selection. */
export const QUOTE_CATALOG: QuoteSeed[] = raw.map((q) => ({
  id: q.id,
  text: q.text,
  author: q.author,
  pillar: q.pillar,
  slots: q.slots,
  tags: q.tags,
}));

export const QUOTE_CATALOG_COUNT = QUOTE_CATALOG.length;
