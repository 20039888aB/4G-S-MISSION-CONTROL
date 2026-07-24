import { create } from 'zustand';
import { uid } from '@/lib/utils';

export type ToastType = 'info' | 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface UiState {
  mobileSidebarOpen: boolean;
  commandPaletteOpen: boolean;
  toasts: ToastItem[];
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  addToast: (type: ToastType, message: string) => string;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  toasts: [],

  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),

  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),

  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  addToast: (type, message) => {
    const id = uid();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
