import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WeightRegimenId } from '@/services/health/bmi';
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
  /** When true, local in-app reminders and inbox alerts are active. */
  notificationsEnabled: boolean;
  /** Profile height for BMI (cm). */
  profileHeightCm?: number;
  /** Desired body weight (kg). */
  targetWeightKg?: number;
  /** Weight when the plan started (kg). */
  startWeightKg?: number;
  weightRegimenId: WeightRegimenId;
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
  setNotificationsEnabled: (enabled: boolean) => void;
  setProfileHeightCm: (cm: number | undefined) => void;
  setTargetWeightKg: (kg: number | undefined) => void;
  setStartWeightKg: (kg: number | undefined) => void;
  setWeightRegimenId: (id: WeightRegimenId) => void;
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
      notificationsEnabled: true,
      profileHeightCm: undefined,
      targetWeightKg: undefined,
      startWeightKg: undefined,
      weightRegimenId: 'steady',

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

      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),

      setProfileHeightCm: (profileHeightCm) => set({ profileHeightCm }),
      setTargetWeightKg: (targetWeightKg) => set({ targetWeightKg }),
      setStartWeightKg: (startWeightKg) => set({ startWeightKg }),
      setWeightRegimenId: (weightRegimenId) => set({ weightRegimenId }),

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
        notificationsEnabled: state.notificationsEnabled,
        profileHeightCm: state.profileHeightCm,
        targetWeightKg: state.targetWeightKg,
        startWeightKg: state.startWeightKg,
        weightRegimenId: state.weightRegimenId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.applyThemeClass();
      },
    },
  ),
);
