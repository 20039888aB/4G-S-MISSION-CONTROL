import { db } from '@/db/database';
import { useMissionScores } from '@/hooks/useMissionScores';
import {
  buildCallsign,
  isoWeekKey,
  pillarsFromMission,
} from '@/services/mission/callsign';
import type { AccountabilityCard } from '@/types';

export async function buildAccountabilityCard(
  scores: ReturnType<typeof useMissionScores>,
  note?: string,
): Promise<AccountabilityCard> {
  const profile = await db.profiles.toCollection().first();
  const today = new Date().toISOString().slice(0, 10);
  const habits = await db.habits.filter((h) => !h.archived).toArray();
  const logs = await db.habitLogs.where('date').equals(today).toArray();
  const done = habits.filter((h) =>
    logs.some((l) => l.habitId === h.id && l.count >= h.targetPerDay),
  ).length;
  const pillars = pillarsFromMission(scores);
  const { callsign } = buildCallsign(pillars);

  return {
    v: 1,
    name: profile?.displayName || profile?.username || 'Operator',
    callsign,
    weekKey: isoWeekKey(),
    overall: scores.overall,
    god: pillars.god,
    goals: pillars.goals,
    grinding: pillars.grinding,
    gratitude: pillars.gratitude,
    habitsDone: done,
    habitsTarget: habits.length,
    note: note?.trim() || undefined,
    generatedAt: new Date().toISOString(),
  };
}

export function encodeAccountabilityCard(card: AccountabilityCard): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(card))));
}

export function decodeAccountabilityCard(raw: string): AccountabilityCard | null {
  try {
    const json = decodeURIComponent(escape(atob(raw)));
    const card = JSON.parse(json) as AccountabilityCard;
    if (card?.v !== 1 || typeof card.overall !== 'number') return null;
    return card;
  } catch {
    return null;
  }
}

export function accountabilityShareUrl(card: AccountabilityCard): string {
  const hash = encodeAccountabilityCard(card);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/share/${hash}`;
}
