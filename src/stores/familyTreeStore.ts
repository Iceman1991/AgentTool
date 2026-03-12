import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid } from '../lib/utils';
import type { FamilyTree } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface FamilyTreeStoreState {
  familyTrees: FamilyTree[];
  loading: boolean;
  load: () => Promise<void>;
  createFamilyTree: (data?: Partial<FamilyTree>) => Promise<FamilyTree>;
  updateFamilyTree: (id: string, data: Partial<FamilyTree>) => Promise<void>;
  deleteFamilyTree: (id: string) => Promise<void>;
}

export const useFamilyTreeStore = create<FamilyTreeStoreState>((set) => ({
  familyTrees: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const { data } = await supabase.from('family_trees').select('*').eq('user_id', userId).order('createdAt', { ascending: true });
    const all = (data ?? []).map(({ user_id: _u, ...r }: any) => r as FamilyTree);
    set({ familyTrees: all.filter((t: FamilyTree) => !t.workspaceId || t.workspaceId === wsId), loading: false });
  },

  createFamilyTree: async (data = {}) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const now = Date.now();
    const newTree: FamilyTree = {
      id: uid(),
      name: data.name ?? 'Neuer Stammbaum',
      description: data.description,
      rootEntityId: data.rootEntityId,
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('family_trees').insert({ ...newTree, user_id: userId });
    set(state => ({ familyTrees: [...state.familyTrees, newTree] }));
    return newTree;
  },

  updateFamilyTree: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('family_trees').update(updated).eq('id', id);
    set(state => ({ familyTrees: state.familyTrees.map(t => t.id === id ? { ...t, ...updated } : t) }));
  },

  deleteFamilyTree: async (id) => {
    await supabase.from('family_trees').delete().eq('id', id);
    set(state => ({ familyTrees: state.familyTrees.filter(t => t.id !== id) }));
  },
}));
