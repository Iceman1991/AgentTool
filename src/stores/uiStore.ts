import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EntityViewMode, ModalConfig } from '../types';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  entityViewMode: EntityViewMode;
  modal: ModalConfig | null;
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
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      entityViewMode: 'grid',
      modal: null,

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
        sidebarCollapsed: state.sidebarCollapsed,
        entityViewMode: state.entityViewMode,
      }),
    }
  )
);
