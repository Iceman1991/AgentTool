import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db';
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
        const all = await db.workspaces.orderBy('createdAt').toArray();
        // If no workspaces exist yet, create the default one
        if (all.length === 0) {
          const defaultWs: Workspace = {
            id: DEFAULT_WS_ID,
            name: 'Standard',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          await db.workspaces.add(defaultWs);
          set({ workspaces: [defaultWs] });
        } else {
          set({ workspaces: all });
        }
      },

      createWorkspace: async (name, description, color) => {
        const ws: Workspace = {
          id: uid(),
          name,
          description,
          color,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await db.workspaces.add(ws);
        set(state => ({ workspaces: [...state.workspaces, ws] }));
        return ws;
      },

      updateWorkspace: async (id, data) => {
        const updated = { ...data, updatedAt: Date.now() };
        await db.workspaces.update(id, updated);
        set(state => ({
          workspaces: state.workspaces.map(w => w.id === id ? { ...w, ...updated } : w),
        }));
      },

      deleteWorkspace: async (id) => {
        if (id === DEFAULT_WS_ID) return; // can't delete default
        // Move all data to default workspace
        for (const tbl of ['entityTypes', 'entities', 'entityFolders', 'relationships', 'notePages', 'familyTrees', 'timelines']) {
          await (db as any)[tbl]
            .where('workspaceId').equals(id)
            .modify({ workspaceId: DEFAULT_WS_ID });
        }
        await db.workspaces.delete(id);
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

      switchWorkspace: (id) => {
        set({ currentWorkspaceId: id });
      },

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
