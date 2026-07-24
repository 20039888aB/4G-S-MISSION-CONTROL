import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  Cross,
  Gift,
  Goal,
  GraduationCap,
  Heart,
  LayoutDashboard,
  LineChart,
  NotebookPen,
  Settings,
  Sparkles,
  StickyNote,
  Target,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'mission',
    label: 'Mission',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'Daily Review', path: '/review', icon: ClipboardList },
      { label: 'AI Coach', path: '/ai-coach', icon: Sparkles },
      { label: 'Achievements', path: '/achievements', icon: Award },
      { label: 'Statistics', path: '/statistics', icon: LineChart },
    ],
  },
  {
    id: 'daily',
    label: 'Daily',
    items: [
      { label: 'Habits', path: '/habits', icon: CheckSquare },
      { label: 'Tasks', path: '/tasks', icon: Target },
      { label: 'Calendar', path: '/calendar', icon: CalendarDays },
      { label: 'Notes', path: '/notes', icon: StickyNote },
      { label: 'Journal', path: '/journal', icon: NotebookPen },
      { label: 'Gratitude', path: '/gratitude', icon: Heart },
    ],
  },
  {
    id: 'growth',
    label: 'Growth',
    items: [
      { label: 'Goals', path: '/goals', icon: Goal },
      { label: 'Learning', path: '/learning', icon: GraduationCap },
      { label: 'Spiritual', path: '/spiritual', icon: Cross },
    ],
  },
  {
    id: 'life',
    label: 'Life',
    items: [
      { label: 'Health', path: '/health', icon: Activity },
      { label: 'Finance', path: '/finance', icon: Wallet },
      { label: 'Business', path: '/business', icon: Briefcase },
      { label: 'Wishlist', path: '/wishlist', icon: Gift },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ label: 'Settings', path: '/settings', icon: Settings }],
  },
];

export function getPageMeta(pathname: string): { title: string; group?: string } {
  if (pathname === '/') return { title: 'Dashboard', group: 'Mission' };

  for (const group of NAV_GROUPS) {
    const item = group.items.find(
      (nav) => nav.path !== '/' && pathname.startsWith(nav.path),
    );
    if (item) return { title: item.label, group: group.label };
  }

  return { title: 'Mission Control' };
}
