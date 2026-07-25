import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type { CovenantDuration, CovenantStatus, StreakCovenant } from '@/types';

function addDays(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function useCovenantsLive() {
  return useLiveQuery(
    () => db.streakCovenants.orderBy('createdAt').reverse().toArray(),
    [],
  );
}

export async function createCovenant(input: {
  name: string;
  vow: string;
  durationDays: CovenantDuration;
  startDate: string;
  habitIds: string[];
}): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: StreakCovenant = {
    id,
    name: input.name.trim(),
    vow: input.vow.trim(),
    durationDays: input.durationDays,
    startDate: input.startDate.slice(0, 10),
    endDate: addDays(input.startDate.slice(0, 10), input.durationDays - 1),
    status: 'active',
    habitIds: input.habitIds,
    checkIns: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.streakCovenants.add(row);
  await db.activityLogs.add({
    id: uid(),
    entity: 'covenant',
    action: 'created',
    summary: `Covenant sealed start: ${row.name} (${row.durationDays}d)`,
    entityId: id,
    createdAt: now,
  });
  return id;
}

export async function updateCovenant(
  id: string,
  patch: Partial<Pick<StreakCovenant, 'name' | 'vow' | 'habitIds' | 'status' | 'reviewNotes'>>,
): Promise<void> {
  await db.streakCovenants.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function checkInCovenant(
  id: string,
  kept: boolean,
  note?: string,
): Promise<void> {
  const row = await db.streakCovenants.get(id);
  if (!row) return;
  const date = new Date().toISOString().slice(0, 10);
  const checkIns = row.checkIns.filter((c) => c.date !== date);
  checkIns.push({ date, kept, note });
  let status: CovenantStatus = row.status;
  if (!kept && row.status === 'active') status = 'broken';
  await db.streakCovenants.update(id, {
    checkIns,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export async function sealCovenant(id: string, reviewNotes?: string): Promise<void> {
  const row = await db.streakCovenants.get(id);
  if (!row) return;
  const keptDays = row.checkIns.filter((c) => c.kept).length;
  const status: CovenantStatus =
    keptDays >= Math.ceil(row.durationDays * 0.8) ? 'sealed' : 'completed';
  await db.streakCovenants.update(id, {
    status,
    sealedAt: new Date().toISOString(),
    reviewNotes,
    updatedAt: new Date().toISOString(),
  });
  await db.notifications.add({
    id: uid(),
    type: status === 'sealed' ? 'achievement' : 'info',
    title: status === 'sealed' ? 'Covenant sealed' : 'Covenant closed',
    body: `${row.name}: ${keptDays}/${row.durationDays} kept days. ${reviewNotes || ''}`.trim(),
    read: false,
    relatedId: id,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteCovenant(id: string): Promise<void> {
  await db.streakCovenants.delete(id);
}
