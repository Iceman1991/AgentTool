import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid } from '../lib/utils';
import type { Entity, ImagePosition } from '../types';
import { useWorkspaceStore } from './workspaceStore';

type PropertyValue = string | number | boolean | string[] | null;

interface EntityState {
  entities: Entity[];
  loading: boolean;
  load: () => Promise<void>;
  createEntity: (data: Partial<Entity> & { typeId: string; name: string }) => Promise<Entity>;
  updateEntity: (id: string, data: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  hardDeleteEntity: (id: string) => Promise<void>;
  duplicateEntity: (id: string) => Promise<Entity>;
  reorderEntities: (typeId: string, orderedIds: string[]) => Promise<void>;
  getEntity: (id: string) => Entity | undefined;
  getEntitiesByType: (typeId: string) => Entity[];
}

export const useEntityStore = create<EntityState>((set, get) => ({
  entities: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const { data } = await supabase
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .order('"createdAt"', { ascending: true });
    const all = (data ?? []).map(({ user_id: _u, ...rest }) => rest as Entity);
    set({
      entities: all.filter(e => !e.deletedAt && (!e.workspaceId || e.workspaceId === wsId)),
      loading: false,
    });
  },

  createEntity: async (data) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const now = Date.now();
    const typeEntities = get().entities.filter(e => e.typeId === data.typeId);
    const maxOrder = typeEntities.reduce((m, e) => Math.max(m, e.order ?? 0), -1);
    const newEntity: Entity = {
      id: uid(),
      typeId: data.typeId,
      name: data.name,
      summary: data.summary,
      imageUrl: data.imageUrl,
      imagePosition: data.imagePosition,
      folderId: data.folderId,
      order: maxOrder + 1,
      properties: data.properties ?? {},
      tags: data.tags ?? [],
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('entities').insert({ ...newEntity, user_id: userId });
    set(state => ({ entities: [...state.entities, newEntity] }));
    return newEntity;
  },

  updateEntity: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('entities').update(updated).eq('id', id);
    set(state => ({
      entities: state.entities.map(e => e.id === id ? { ...e, ...updated } : e),
    }));
  },

  deleteEntity: async (id) => {
    const deletedAt = Date.now();
    await supabase.from('entities').update({ deletedAt }).eq('id', id);
    set(state => ({ entities: state.entities.filter(e => e.id !== id) }));
  },

  hardDeleteEntity: async (id) => {
    await supabase.from('entities').delete().eq('id', id);
    set(state => ({ entities: state.entities.filter(e => e.id !== id) }));
  },

  duplicateEntity: async (id) => {
    const source = get().entities.find(e => e.id === id);
    if (!source) throw new Error('Entity not found');
    const userId = getUserId();
    const typeEntities = get().entities.filter(e => e.typeId === source.typeId);
    const maxOrder = typeEntities.reduce((m, e) => Math.max(m, e.order ?? 0), -1);
    const now = Date.now();
    const copy: Entity = {
      ...source,
      id: uid(),
      name: source.name + ' (Kopie)',
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: undefined,
    };
    await supabase.from('entities').insert({ ...copy, user_id: userId });
    set(state => ({ entities: [...state.entities, copy] }));
    return copy;
  },

  reorderEntities: async (typeId, orderedIds) => {
    const now = Date.now();
    await Promise.all(
      orderedIds.map((id, order) =>
        supabase.from('entities').update({ order, updatedAt: now }).eq('id', id)
      )
    );
    set(state => ({
      entities: state.entities.map(e => {
        const idx = orderedIds.indexOf(e.id);
        return idx !== -1 ? { ...e, order: idx } : e;
      }),
    }));
  },

  getEntity: (id) => get().entities.find(e => e.id === id),
  getEntitiesByType: (typeId) => get().entities
    .filter(e => e.typeId === typeId)
    .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt)),
}));

export type { PropertyValue };
