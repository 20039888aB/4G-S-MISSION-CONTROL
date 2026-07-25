import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui';
import { db } from '@/db/database';
import { cn, formatRelative } from '@/lib/utils';
import {
  clearAllNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notifications/local';
import type { NotificationType } from '@/types';

function typeTone(type: NotificationType): string {
  switch (type) {
    case 'success':
    case 'achievement':
      return 'bg-success/15 text-success';
    case 'warning':
      return 'bg-warning/15 text-warning';
    case 'reminder':
      return 'bg-accent/15 text-accent';
    default:
      return 'bg-surface text-text-muted';
  }
}

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const items =
    useLiveQuery(
      () => db.notifications.orderBy('createdAt').reverse().limit(40).toArray(),
      [],
    ) ?? [];

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg-elevated shadow-[var(--shadow-soft)]"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <Bell className="size-4 text-accent" />
        <p className="font-display text-sm font-semibold">Notifications</p>
        <button
          type="button"
          className="ml-auto rounded-md p-1 text-text-muted hover:bg-surface hover:text-text"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-1 border-b border-border px-2 py-1.5">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 text-xs"
          onClick={() => void markAllNotificationsRead()}
          disabled={!items.some((n) => !n.read)}
        >
          <CheckCheck className="size-3.5" />
          Mark all read
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 text-xs"
          onClick={() => void clearAllNotifications()}
          disabled={items.length === 0}
        >
          <Trash2 className="size-3.5" />
          Clear
        </Button>
      </div>

      <ul className="max-h-[22rem] overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-text-muted">
            No notifications yet. Reminders will appear here.
          </li>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className={cn(
                'border-b border-border/70 px-3 py-2.5 last:border-b-0',
                !n.read && 'bg-accent-soft/40',
              )}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => {
                  if (!n.read) void markNotificationRead(n.id);
                }}
              >
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                      typeTone(n.type),
                    )}
                  >
                    {n.type}
                  </span>
                  <span className="ml-auto text-[10px] text-text-muted">
                    {formatRelative(n.createdAt)}
                  </span>
                </div>
                <p className="text-sm font-medium text-text">{n.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-muted">{n.body}</p>
              </button>
              <div className="mt-1.5 flex justify-end">
                <button
                  type="button"
                  className="text-[11px] text-text-muted hover:text-danger"
                  onClick={() => void deleteNotification(n.id)}
                >
                  Dismiss
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
