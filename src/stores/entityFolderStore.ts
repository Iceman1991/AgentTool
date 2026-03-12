import { create } from 'zustand';
import { db } from '../db';
import { uid } from '../lib/utils';
import type { EntityFolder } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface EntityFolderState {
  folders: EntityFolder[];
  load: () => Promise<void>;
  createFolder: (typeId: string, name: string) => Promise<EntityFolder>;
  updateFolder: (id: string, data: Partial<EntityFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFoldersByType: (typeId: string) => EntityFolder[];
}

export const useEntityFolderStore = create<EntityFolderState>((set, get) => ({
  folders: [],

  load: async () => {
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const all = await db.entityFolders.orderBy('createdAt').toArray();
    set({ folders: all.filter(f => !f.workspaceId || f.workspaceId === wsId) });
  },

  createFolder: async (typeId, name) => {
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const siblings = get().folders.filter(f => f.typeId === typeId);
    const maxOrder = siblings.reduce((m, f) => Math.max(m, f.order), -1);
    const folder: EntityFolder = {
      id: uid(),
      typeId,
      name,
      order: maxOrder + 1,
      workspaceId: wsId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.entityFolders.add(folder);
    set(state => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  updateFolder: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.entityFolders.update(id, updated);
    set(state => ({
      folders: state.folders.map(f => f.id === id ? { ...f, ...updated } : f),
    }));
  },

  deleteFolder: async (id) => {
    // Unset folderId for all entities in this folder
    const entities = await db.entities.where('folderId').equals(id).toArray();
    await Promise.all(entities.map(e => db.entities.update(e.id, { folderId: undefined })));
    await db.entityFolders.delete(id);
    set(state => ({ folders: state.folders.filter(f => f.id !== id) }));
  },

  getFoldersByType: (typeId) => get().folders.filter(f => f.typeId === typeId).sort((a, b) => a.order - b.order),
}));
