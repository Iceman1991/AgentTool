import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
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
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const { data } = await supabase
      .from('entity_folders')
      .select('*')
      .eq('user_id', userId)
      .order('"createdAt"', { ascending: true });
    const all = (data ?? []).map(({ user_id: _u, ...rest }) => rest as EntityFolder);
    set({ folders: all.filter(f => !f.workspaceId || f.workspaceId === wsId) });
  },

  createFolder: async (typeId, name) => {
    const userId = getUserId();
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
    await supabase.from('entity_folders').insert({ ...folder, user_id: userId });
    set(state => ({ folders: [...state.folders, folder] }));
    return folder;
  },

  updateFolder: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('entity_folders').update(updated).eq('id', id);
    set(state => ({
      folders: state.folders.map(f => f.id === id ? { ...f, ...updated } : f),
    }));
  },

  deleteFolder: async (id) => {
    // Unset folderId for all entities in this folder
    await supabase.from('entities').update({ folderId: null }).eq('folderId', id);
    await supabase.from('entity_folders').delete().eq('id', id);
    set(state => ({ folders: state.folders.filter(f => f.id !== id) }));
  },

  getFoldersByType: (typeId) => get().folders.filter(f => f.typeId === typeId).sort((a, b) => a.order - b.order),
}));
