import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getUserId } from '../lib/supabase';
import { uid } from '../lib/utils';
import type { Workspace } from '../types';

const DEFAULT_WS_ID = 'default-workspace';

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  load: () => Promise<void>;
  createWorkspace: (name: string, description?: string, color?: string) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  switchWorkspace: (id: string) => void;
  getCurrentWorkspace: () => Workspace | undefined;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      currentWorkspaceId: DEFAULT_WS_ID,

      load: async () => {
        const userId = getUserId();
        const { data } = await supabase
          .from('workspaces')
          .select('*')
          .eq('user_id', userId)
          .order('"createdAt"', { ascending: true });

        const all: Workspace[] = (data ?? []).map(({ user_id: _u, ...rest }) => rest as Workspace);

        if (all.length === 0) {
          const defaultWs: Workspace = {
            id: DEFAULT_WS_ID,
            name: 'Standard',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await supabase.from('workspaces').insert({ ...defaultWs, user_id: userId });
          set({ workspaces: [defaultWs] });
        } else {
          set({ workspaces: all });
        }
      },

      createWorkspace: async (name, description, color) => {
        const userId = getUserId();
        const ws: Workspace = {
          id: uid(),
          name,
          description,
          color,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await supabase.from('workspaces').insert({ ...ws, user_id: userId });
        set(state => ({ workspaces: [...state.workspaces, ws] }));
        return ws;
      },

      updateWorkspace: async (id, data) => {
        const updated = { ...data, updatedAt: Date.now() };
        await supabase.from('workspaces').update(updated).eq('id', id);
        set(state => ({
          workspaces: state.workspaces.map(w => w.id === id ? { ...w, ...updated } : w),
        }));
      },

      deleteWorkspace: async (id) => {
        if (id === DEFAULT_WS_ID) return;
        const userId = getUserId();
        for (const tbl of ['entity_types', 'entities', 'entity_folders', 'note_pages', 'family_trees', 'timelines']) {
          await supabase.from(tbl).update({ workspaceId: DEFAULT_WS_ID }).eq('workspaceId', id).eq('user_id', userId);
        }
        await supabase.from('workspaces').delete().eq('id', id);
        set(state => {
          const remaining = state.workspaces.filter(w => w.id !== id);
          return {
            workspaces: remaining,
            currentWorkspaceId: state.currentWorkspaceId === id
              ? (remaining[0]?.id ?? DEFAULT_WS_ID)
              : state.currentWorkspaceId,
          };
        });
      },

      switchWorkspace: (id) => set({ currentWorkspaceId: id }),

      getCurrentWorkspace: () => {
        const { workspaces, currentWorkspaceId } = get();
        return workspaces.find(w => w.id === currentWorkspaceId);
      },
    }),
    {
      name: 'pf2-workspace',
      partialize: (state) => ({ currentWorkspaceId: state.currentWorkspaceId }),
    }
  )
);
