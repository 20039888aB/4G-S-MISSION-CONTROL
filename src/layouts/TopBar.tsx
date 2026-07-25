import {
  Bell,
  Command,
  LogOut,
  Menu,
  Moon,
  Sun,
  UserRound,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Button } from '@/components/ui';
import { db } from '@/db/database';
import { formatGreeting } from '@/services/quotes/engine';
import { cn } from '@/lib/utils';
import { getPageMeta } from '@/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const meta = getPageMeta(location.pathname);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const displayName = useAuthStore((s) => s.displayName);
  const username = useAuthStore((s) => s.username);
  const logout = useAuthStore((s) => s.logout);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);
  const setCommandOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const addToast = useUiStore((s) => s.addToast);

  const unread =
    useLiveQuery(() => db.notifications.filter((n) => !n.read).count(), []) ?? 0;

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const greeting = formatGreeting(displayName, now);
  const isDashboard = location.pathname === '/' || location.pathname === '';

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (!notifRef.current?.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  function cycleTheme() {
    const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    setTheme(next);
    addToast('info', `Theme: ${next}`);
  }

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-xl sm:px-6">
      <button
        type="button"
        className="inline-flex rounded-md p-2 text-text-muted hover:bg-surface hover:text-text lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </button>

      {isDashboard ? (
        <div className="hidden items-center sm:flex">
          <Logo size="sm" variant="mark" showWordmark={false} />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        {meta.group ? (
          <p className="text-[11px] font-semibold tracking-[0.16em] text-accent uppercase">
            {meta.group}
          </p>
        ) : null}
        <h1 className="truncate font-display text-lg font-semibold text-text sm:text-xl">
          {isDashboard ? greeting.line : meta.title}
        </h1>
        {isDashboard ? (
          <p className="truncate text-[11px] text-text-muted">
            {greeting.label} · {greeting.clockLabel}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden px-2 sm:inline-flex"
          onClick={() => setCommandOpen(true)}
          aria-label="Quick actions"
        >
          <Command className="size-4" />
          <span className="text-xs text-text-muted">Quick</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="px-2"
          onClick={cycleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="sm"
            className="relative px-2"
            onClick={() => {
              setNotifOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
          >
            <Bell className="size-4" />
            {unread > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#0b1220]">
                {unread > 9 ? '9+' : unread}
              </span>
            ) : null}
          </Button>
          <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              setNotifOpen(false);
            }}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-bg-elevated px-2.5 py-1.5 text-sm',
              'hover:border-accent/40',
            )}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent">
              <UserRound className="size-4" />
            </span>
            <span className="hidden max-w-[8rem] truncate font-medium sm:inline">
              {displayName ?? username ?? 'Operator'}
            </span>
          </button>

          {menuOpen ? (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-[var(--radius-md)] border border-border bg-bg-elevated shadow-[var(--shadow-soft)]">
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-sm font-medium text-text">
                  {displayName ?? 'Operator'}
                </p>
                <p className="truncate text-xs text-text-muted">@{username}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger/10"
              >
                <LogOut className="size-4" />
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
