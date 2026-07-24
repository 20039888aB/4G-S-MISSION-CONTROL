import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type { G4Pillar, Note, NoteType } from '@/types';

export type NoteInput = {
  title: string;
  body: string;
  type: NoteType;
  pillar?: G4Pillar;
  tags: string[];
  pinned?: boolean;
};

export function useNotesLive(query = '') {
  return useLiveQuery(async () => {
    const notes = await db.notes.toArray();
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (!q) return true;
        return (
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [query]);
}

export async function createNote(input: NoteInput): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const note: Note = {
    id,
    title: input.title.trim() || 'Untitled',
    body: input.body.trim(),
    type: input.type,
    pillar: input.pillar,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    pinned: input.pinned ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  return id;
}

export async function updateNote(id: string, input: NoteInput): Promise<void> {
  await db.notes.update(id, {
    title: input.title.trim() || 'Untitled',
    body: input.body.trim(),
    type: input.type,
    pillar: input.pillar,
    tags: input.tags.map((t) => t.trim()).filter(Boolean),
    pinned: input.pinned ?? false,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await db.notes.delete(id);
}

export async function toggleNotePinned(note: Note): Promise<void> {
  await db.notes.update(note.id, {
    pinned: !note.pinned,
    updatedAt: new Date().toISOString(),
  });
}
