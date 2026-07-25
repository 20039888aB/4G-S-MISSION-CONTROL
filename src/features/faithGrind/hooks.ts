import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import { showLocalNotification } from '@/services/notifications/local';
import type { FaithGrindLink } from '@/types';

const DEFAULT_PROMPTS = [
  {
    scripture: 'Colossians 3:23 — Whatever you do, work heartily, as for the Lord.',
    reflectionPrompt: 'How did today’s grind become worship, not just hustle?',
  },
  {
    scripture: 'Proverbs 16:3 — Commit your work to the Lord, and your plans will be established.',
    reflectionPrompt: 'What plan will you commit to God before you execute tomorrow?',
  },
  {
    scripture: 'Galatians 6:9 — Let us not grow weary of doing good.',
    reflectionPrompt: 'Where were you tempted to quit — and what kept you moving?',
  },
];

export function useFaithGrindLinksLive() {
  return useLiveQuery(async () => {
    try {
      const rows = await db.faithGrindLinks.toArray();
      return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }, []);
}

export async function createFaithGrindLink(input: {
  habitId: string;
  scripture: string;
  reflectionPrompt: string;
}): Promise<string> {
  const now = new Date().toISOString();
  const id = uid();
  const row: FaithGrindLink = {
    id,
    habitId: input.habitId,
    scripture: input.scripture.trim(),
    reflectionPrompt: input.reflectionPrompt.trim(),
    active: true,
    unlockCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await db.faithGrindLinks.add(row);
  return id;
}

export async function updateFaithGrindLink(
  id: string,
  patch: Partial<Pick<FaithGrindLink, 'scripture' | 'reflectionPrompt' | 'active' | 'habitId'>>,
): Promise<void> {
  await db.faithGrindLinks.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteFaithGrindLink(id: string): Promise<void> {
  await db.faithGrindLinks.delete(id);
}

export async function unlockFaithForHabit(habitId: string, habitName: string): Promise<void> {
  let links = await db.faithGrindLinks
    .filter((l) => l.active && l.habitId === habitId)
    .toArray();

  if (links.length === 0) {
    // Auto-seed one link the first time a habit completes with no link.
    const pick = DEFAULT_PROMPTS[Math.floor(Math.random() * DEFAULT_PROMPTS.length)]!;
    const id = await createFaithGrindLink({
      habitId,
      scripture: pick.scripture,
      reflectionPrompt: pick.reflectionPrompt,
    });
    links = [(await db.faithGrindLinks.get(id))!];
  }

  const link = links[0];
  if (!link) return;

  await db.faithGrindLinks.update(link.id, {
    unlockCount: link.unlockCount + 1,
    lastUnlockedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await showLocalNotification(
    `Faith × Grind · ${habitName}`,
    `${link.scripture}\n\nReflect: ${link.reflectionPrompt}`,
    'info',
    { id: `faith-grind-${habitId}-${new Date().toISOString().slice(0, 10)}`, silent: false },
  );
}

export { DEFAULT_PROMPTS };
