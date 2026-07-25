import { db } from '@/db/database';
import { SCHEMA_V4, type TableName } from '@/db/schema';
import { formatDate } from '@/lib/utils';

const TABLE_NAMES = Object.keys(SCHEMA_V4) as TableName[];

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
}

export async function exportAllData(): Promise<BackupPayload & { appPrefs?: unknown }> {
  const tables: Record<string, unknown[]> = {};

  for (const name of TABLE_NAMES) {
    tables[name] = await db.table(name).toArray();
  }

  let appPrefs: unknown;
  try {
    const raw = localStorage.getItem('g4-settings');
    appPrefs = raw ? JSON.parse(raw) : undefined;
  } catch {
    appPrefs = undefined;
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    tables,
    appPrefs,
  };
}

export async function importAllData(data: unknown): Promise<void> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup payload.');
  }

  const payload = data as Partial<BackupPayload>;
  if (!payload.tables || typeof payload.tables !== 'object') {
    throw new Error('Backup is missing tables.');
  }

  await db.transaction('rw', TABLE_NAMES.map((name) => db.table(name)), async () => {
    for (const name of TABLE_NAMES) {
      const rows = payload.tables?.[name];
      if (!Array.isArray(rows)) continue;
      await db.table(name).clear();
      if (rows.length > 0) {
        await db.table(name).bulkAdd(rows);
      }
    }
  });

  const prefs = (payload as { appPrefs?: unknown }).appPrefs;
  if (prefs && typeof prefs === 'object') {
    try {
      localStorage.setItem('g4-settings', JSON.stringify(prefs));
    } catch {
      /* ignore quota */
    }
  }
}

export async function downloadBackup(): Promise<void> {
  const payload = await exportAllData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const stamp = formatDate(new Date(), 'yyyy-MM-dd-HHmm');
  anchor.href = url;
  anchor.download = `g4-mission-control-backup-${stamp}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(
  tableName: string,
  rows: Record<string, unknown>[],
): void {
  if (rows.length === 0) {
    const empty = new Blob([''], { type: 'text/csv;charset=utf-8' });
    triggerDownload(empty, `${tableName}.csv`);
    return;
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => csvEscape(row[header]))
        .join(','),
    ),
  ];

  const blob = new Blob([lines.join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  triggerDownload(blob, `${tableName}.csv`);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  const raw =
    typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
