import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type { NotificationItem, NotificationType } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

type TimerHandle = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

const scheduled: TimerHandle[] = [];
let schedulerRunning = false;

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

async function showSystemBanner(title: string, body: string, tag?: string): Promise<void> {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker?.ready.catch(() => undefined);
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon: './pwa-192.png',
        badge: './favicon.svg',
        tag: tag ?? 'g4-mission',
        data: { source: 'g4-local' },
      });
      return;
    }
  } catch {
    // Fall through to window Notification.
  }

  try {
    new Notification(title, {
      body,
      icon: './pwa-192.png',
      badge: './favicon.svg',
      tag: tag ?? 'g4-mission',
    });
  } catch {
    // Some browsers block Notification construction outside user gestures.
  }
}

function toastForType(type: NotificationType): 'info' | 'success' | 'warning' | 'danger' {
  if (type === 'success' || type === 'achievement') return 'success';
  if (type === 'warning') return 'warning';
  return 'info';
}

/** Create an in-app notification (always). Optionally mirror to OS banner if allowed. */
export async function showLocalNotification(
  title: string,
  body: string,
  type: NotificationType = 'reminder',
  options?: {
    id?: string;
    relatedId?: string;
    silent?: boolean;
    skipSystem?: boolean;
  },
): Promise<NotificationItem | null> {
  const enabled = useSettingsStore.getState().notificationsEnabled;
  if (!enabled) return null;

  const id = options?.id ?? uid();
  if (options?.id) {
    const existing = await db.notifications.get(id);
    if (existing) return existing;
  }

  const item: NotificationItem = {
    id,
    type,
    title,
    body,
    read: false,
    relatedId: options?.relatedId,
    createdAt: new Date().toISOString(),
  };
  await db.notifications.add(item);

  if (!options?.silent) {
    useUiStore.getState().addToast(toastForType(type), title);
  }

  if (!options?.skipSystem) {
    await showSystemBanner(title, body, id);
  }

  return item;
}

function parseHm(value: string, fallbackH: number, fallbackM: number): [number, number] {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return [fallbackH, fallbackM];
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) {
    return [fallbackH, fallbackM];
  }
  return [h, m];
}

function msUntilNext(hour: number, minute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function scheduleDaily(
  key: string,
  hour: number,
  minute: number,
  title: string,
  body: string,
  type: NotificationType = 'reminder',
): void {
  const fire = () => {
    void showLocalNotification(title, body, type, {
      id: `${key}-${todayKey()}`,
      silent: false,
    });
  };

  const launch = () => {
    fire();
    const daily = setInterval(fire, 24 * 60 * 60 * 1000);
    scheduled.push(daily);
  };

  const timeout = setTimeout(launch, msUntilNext(hour, minute));
  scheduled.push(timeout);
}

async function nudgeIncompleteHabits(): Promise<void> {
  const date = todayKey();
  const habits = await db.habits.filter((h) => !h.archived).toArray();
  if (!habits.length) return;
  const logs = await db.habitLogs.where('date').equals(date).toArray();
  const done = new Set(logs.filter((l) => l.count > 0).map((l) => l.habitId));
  const remaining = habits.filter((h) => !done.has(h.id)).length;
  if (remaining <= 0) return;

  await showLocalNotification(
    'Habits still open',
    `${remaining} habit${remaining === 1 ? '' : 's'} left today. Close one loop and keep the streak.`,
    'reminder',
    { id: `habits-open-${date}` },
  );
}

/** Local-only reminders — no servers. Works fully inside the app inbox. */
export async function startLocalReminderScheduler(): Promise<void> {
  stopLocalReminderScheduler();

  const enabled = useSettingsStore.getState().notificationsEnabled;
  if (!enabled) {
    schedulerRunning = false;
    return;
  }

  schedulerRunning = true;
  const wake = useSettingsStore.getState().wakeTime;
  const sleep = useSettingsStore.getState().sleepTarget;
  const [wakeH, wakeM] = parseHm(wake, 5, 0);
  const [sleepH, sleepM] = parseHm(sleep, 21, 30);

  scheduleDaily(
    'morning-motivation',
    wakeH,
    wakeM,
    'Morning Motivation',
    'Rise with purpose. God • Goals • Grinding • Gratitude.',
  );
  scheduleDaily(
    'hydration',
    10,
    0,
    'Hydration Check',
    'Drink a glass of water and reset your focus.',
  );
  scheduleDaily(
    'afternoon-push',
    14,
    0,
    'Afternoon Push',
    "One focused block now compounds into tonight's peace.",
  );
  scheduleDaily(
    'evening-reflection',
    sleepH,
    Math.max(0, sleepM - 30),
    'Evening Reflection',
    "Log gratitude and prepare tomorrow's first win.",
    'reminder',
  );

  // Mid-evening habit nudge
  const habitNudgeDelay = msUntilNext(18, 0);
  const habitTimeout = setTimeout(() => {
    void nudgeIncompleteHabits();
    const daily = setInterval(() => void nudgeIncompleteHabits(), 24 * 60 * 60 * 1000);
    scheduled.push(daily);
  }, habitNudgeDelay);
  scheduled.push(habitTimeout);

  // Welcome / verification nudge shortly after arming (deduped per day).
  const demo = setTimeout(() => {
    void showLocalNotification(
      'Mission Control Online',
      'In-app reminders are armed. Tap the bell anytime to review them.',
      'info',
      { id: `mission-online-${todayKey()}`, skipSystem: false },
    );
  }, 8_000);
  scheduled.push(demo);
}

export function stopLocalReminderScheduler(): void {
  while (scheduled.length > 0) {
    const handle = scheduled.pop();
    if (handle !== undefined) {
      clearTimeout(handle);
      clearInterval(handle);
    }
  }
  schedulerRunning = false;
}

export function isReminderSchedulerRunning(): boolean {
  return schedulerRunning;
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.notifications.update(id, { read: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  const unread = await db.notifications.filter((n) => !n.read).toArray();
  await Promise.all(unread.map((item) => db.notifications.update(item.id, { read: true })));
}

export async function deleteNotification(id: string): Promise<void> {
  await db.notifications.delete(id);
}

export async function clearAllNotifications(): Promise<void> {
  await db.notifications.clear();
}

/** Manual test from Settings — proves the in-app pipeline. */
export async function sendTestNotification(): Promise<boolean> {
  const item = await showLocalNotification(
    'Test notification',
    'If you can see this under the bell, in-app alerts are working.',
    'success',
    { skipSystem: false },
  );
  return Boolean(item);
}
