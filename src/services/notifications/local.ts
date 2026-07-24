import { db } from '@/db/database';
import { uid } from '@/lib/utils';
import type { NotificationItem, NotificationType } from '@/types';

type TimerHandle = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

const scheduled: TimerHandle[] = [];

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function showLocalNotification(
  title: string,
  body: string,
  type: NotificationType = 'reminder',
): Promise<void> {
  const item: NotificationItem = {
    id: uid(),
    type,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await db.notifications.add(item);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: './logo-main.jpeg',
        badge: './favicon.svg',
      });
    } catch {
      // Ignore environments that block Notification construction.
    }
  }
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

function scheduleDaily(
  hour: number,
  minute: number,
  title: string,
  body: string,
): void {
  const launch = () => {
    void showLocalNotification(title, body, 'reminder');
    const daily = setInterval(
      () => {
        void showLocalNotification(title, body, 'reminder');
      },
      24 * 60 * 60 * 1000,
    );
    scheduled.push(daily);
  };

  const timeout = setTimeout(launch, msUntilNext(hour, minute));
  scheduled.push(timeout);
}

/** Demo reminder schedule for local-first notifications. */
export async function startLocalReminderScheduler(): Promise<void> {
  stopLocalReminderScheduler();
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return;

  scheduleDaily(5, 0, 'Morning Motivation', 'Rise with purpose. God • Goals • Grinding • Gratitude.');
  scheduleDaily(10, 0, 'Hydration Check', 'Drink a glass of water and reset your focus.');
  scheduleDaily(14, 0, 'Afternoon Push', 'One focused block now compounds into tonight\'s peace.');
  scheduleDaily(20, 30, 'Evening Reflection', 'Log gratitude and prepare tomorrow\'s first win.');

  // Short demo nudge ~45s after start for UX verification.
  const demo = setTimeout(() => {
    void showLocalNotification(
      'Mission Control Online',
      'Local reminders are armed. Stay disciplined.',
      'info',
    );
  }, 45_000);
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
}

export async function markNotificationRead(id: string): Promise<void> {
  await db.notifications.update(id, { read: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  const unread = await db.notifications.filter((n) => !n.read).toArray();
  await Promise.all(
    unread.map((item) => db.notifications.update(item.id, { read: true })),
  );
}
