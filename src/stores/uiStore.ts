import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, EntityViewMode, ModalConfig } from '../types';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  entityViewMode: EntityViewMode;
  modal: ModalConfig | null;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setEntityViewMode: (mode: EntityViewMode) => void;
  openModal: (config: ModalConfig) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      entityViewMode: 'grid',
      modal: null,

      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
        } else if (theme === 'light') {
          root.classList.remove('dark');
          root.classList.add('light');
        } else {
          // system
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
          root.classList.toggle('light', !prefersDark);
        }
      },

      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleMobileSidebar: () => set(s => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      setEntityViewMode: (mode) => set({ entityViewMode: mode }),
      openModal: (config) => set({ modal: config }),
      closeModal: () => set({ modal: null }),
    }),
    {
      name: 'pf2-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        entityViewMode: state.entityViewMode,
      }),
    }
  )
);
