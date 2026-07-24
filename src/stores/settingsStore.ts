import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SidebarAccordionMode, ThemeMode } from '@/types';

const DEFAULT_WIDGETS = [
  'mission-scores',
  'habits-today',
  'goals-progress',
  'finance-snapshot',
  'ai-coach',
  'quote',
  'gratitude',
  'upcoming',
];

interface SettingsState {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  sidebarAccordionMode: SidebarAccordionMode;
  currency: string;
  wakeTime: string;
  sleepTarget: string;
  dashboardWidgets: string[];
  /** When true, coach auto-speaks replies and insights can be heard. */
  coachVoiceEnabled: boolean;
  setTheme: (theme: ThemeMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarAccordionMode: (mode: SidebarAccordionMode) => void;
  setCurrency: (currency: string) => void;
  setWakeTime: (time: string) => void;
  setSleepTarget: (time: string) => void;
  setDashboardWidgets: (widgets: string[]) => void;
  toggleDashboardWidget: (widgetId: string) => void;
  setCoachVoiceEnabled: (enabled: boolean) => void;
  applyThemeClass: () => void;
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

function applyDocumentTheme(theme: ThemeMode): void {
  const resolved = resolveTheme(theme);
  const root = document.documentElement;
  root.classList.toggle('dark', resolved === 'dark');
  root.dataset.theme = resolved;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarCollapsed: false,
      sidebarAccordionMode: 'single',
      currency: 'KES',
      wakeTime: '04:30',
      sleepTarget: '21:30',
      dashboardWidgets: DEFAULT_WIDGETS,
      coachVoiceEnabled: false,

      setTheme: (theme) => {
        set({ theme });
        applyDocumentTheme(theme);
      },

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarAccordionMode: (sidebarAccordionMode) =>
        set({ sidebarAccordionMode }),

      setCurrency: (currency) => set({ currency }),

      setWakeTime: (wakeTime) => set({ wakeTime }),

      setSleepTarget: (sleepTarget) => set({ sleepTarget }),

      setDashboardWidgets: (dashboardWidgets) => set({ dashboardWidgets }),

      toggleDashboardWidget: (widgetId) =>
        set((state) => {
          const exists = state.dashboardWidgets.includes(widgetId);
          return {
            dashboardWidgets: exists
              ? state.dashboardWidgets.filter((id) => id !== widgetId)
              : [...state.dashboardWidgets, widgetId],
          };
        }),

      setCoachVoiceEnabled: (coachVoiceEnabled) => set({ coachVoiceEnabled }),

      applyThemeClass: () => {
        applyDocumentTheme(get().theme);
      },
    }),
    {
      name: 'g4-settings',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarAccordionMode: state.sidebarAccordionMode,
        currency: state.currency,
        wakeTime: state.wakeTime,
        sleepTarget: state.sleepTarget,
        dashboardWidgets: state.dashboardWidgets,
        coachVoiceEnabled: state.coachVoiceEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.applyThemeClass();
      },
    },
  ),
);
