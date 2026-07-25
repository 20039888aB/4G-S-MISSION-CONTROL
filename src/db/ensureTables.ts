import { db } from '@/db/database';

let ensured: Promise<void> | null = null;

/**
 * Open DB and verify Mission Systems stores exist.
 * Safe to call repeatedly — never deletes user data.
 */
export function ensureMissionTables(): Promise<void> {
  if (ensured) return ensured;
  ensured = (async () => {
    await db.open();
    // Touch each store so missing-table errors surface early (and get caught by callers).
    await Promise.all([
      db.streakCovenants.count().catch(() => 0),
      db.faithGrindLinks.count().catch(() => 0),
      db.warRoomSessions.count().catch(() => 0),
      db.bodyPhotos.count().catch(() => 0),
    ]);
  })();
  return ensured;
}
