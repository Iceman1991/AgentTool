import { create } from 'zustand';
import { db } from '../db';
import { uid } from '../lib/utils';
import type { FamilyTree } from '../types';

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
    const familyTrees = await db.familyTrees.orderBy('createdAt').toArray();
    set({ familyTrees, loading: false });
  },

  createFamilyTree: async (data = {}) => {
    const now = Date.now();
    const newTree: FamilyTree = {
      id: uid(),
      name: data.name ?? 'Neuer Stammbaum',
      description: data.description,
      rootEntityId: data.rootEntityId,
      createdAt: now,
      updatedAt: now,
    };
    await db.familyTrees.add(newTree);
    set(state => ({ familyTrees: [...state.familyTrees, newTree] }));
    return newTree;
  },

  updateFamilyTree: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.familyTrees.update(id, updated);
    set(state => ({
      familyTrees: state.familyTrees.map(t => t.id === id ? { ...t, ...updated } : t),
    }));
  },

  deleteFamilyTree: async (id) => {
    await db.familyTrees.delete(id);
    set(state => ({ familyTrees: state.familyTrees.filter(t => t.id !== id) }));
  },
}));
