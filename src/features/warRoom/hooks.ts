import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import {
  buildCallsign,
  isoWeekKey,
  pillarsFromMission,
} from '@/services/mission/callsign';
import { downloadMissionReportPdf } from '@/services/export/missionReportPdf';
import { evaluateWeeklyReward } from '@/services/rewards/weekly';
import { showLocalNotification } from '@/services/notifications/local';
import type { WarRoomSession } from '@/types';

export function useWarRoomSessionsLive() {
  return useLiveQuery(async () => {
    try {
      const rows = await db.warRoomSessions.toArray();
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }, []);
}

export async function runSundayWarRoom(scores: {
  spiritual: number;
  mission: number;
  discipline: number;
  learning: number;
  health: number;
  finance: number;
  overall: number;
}): Promise<WarRoomSession> {
  const weekKey = isoWeekKey();
  const existing = await db.warRoomSessions.where('weekKey').equals(weekKey).first();
  const pillars = pillarsFromMission(scores);
  const { callsign, blurb } = buildCallsign(pillars, weekKey);
  const reward = await evaluateWeeklyReward();
  const debrief = [
    `Callsign: ${callsign}.`,
    blurb,
    `Weekly reward lens: ${reward.reason}`,
    reward.earned
      ? `Reward unlocked suggestion: ${reward.title} (${reward.budgetHint}).`
      : 'Keep stacking — reward stays locked until consistency rises.',
  ].join(' ');

  const now = new Date().toISOString();
  const row: WarRoomSession = {
    id: existing?.id ?? uid(),
    weekKey,
    score: scores.overall,
    callsign,
    debrief,
    rewardTitle: reward.title,
    rewardEarned: reward.earned,
    notes: existing?.notes,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await db.warRoomSessions.put(row);
  await showLocalNotification(
    'Sunday War Room',
    `${callsign} · Score ${scores.overall}. ${reward.earned ? 'Reward path open.' : 'Stay in the fight.'}`,
    reward.earned ? 'achievement' : 'reminder',
    { id: `war-room-${weekKey}` },
  );

  await db.activityLogs.add({
    id: uid(),
    entity: 'warroom',
    action: 'session',
    summary: `War Room ${weekKey}: ${callsign} (${scores.overall})`,
    entityId: row.id,
    createdAt: now,
  });

  return row;
}

export async function updateWarRoomNotes(id: string, notes: string): Promise<void> {
  await db.warRoomSessions.update(id, {
    notes,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteWarRoomSession(id: string): Promise<void> {
  await db.warRoomSessions.delete(id);
}

export async function exportWarRoomPdf(): Promise<void> {
  await downloadMissionReportPdf();
}
