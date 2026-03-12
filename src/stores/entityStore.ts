import { create } from 'zustand';
import { db } from '../db';
import { uid } from '../lib/utils';
import type { Entity, PropertyValue } from '../types';
import { useWorkspaceStore } from './workspaceStore';

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
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const all = await db.entities.orderBy('createdAt').toArray();
    set({ entities: all.filter(e => !e.deletedAt && (!e.workspaceId || e.workspaceId === wsId)), loading: false });
  },

  createEntity: async (data) => {
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const newEntity: Entity = {
      id: uid(),
      typeId: data.typeId,
      name: data.name,
      summary: data.summary,
      imageUrl: data.imageUrl,
      properties: data.properties || {},
      tags: data.tags || [],
      workspaceId: wsId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.entities.add(newEntity);
    set(state => ({ entities: [...state.entities, newEntity] }));
    return newEntity;
  },

  updateEntity: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.entities.update(id, updated);
    set(state => ({
      entities: state.entities.map(e => e.id === id ? { ...e, ...updated } : e),
    }));
  },

  deleteEntity: async (id) => {
    await db.entities.update(id, { deletedAt: Date.now() });
    set(state => ({ entities: state.entities.filter(e => e.id !== id) }));
  },

  hardDeleteEntity: async (id) => {
    await db.entities.delete(id);
    await db.relationships
      .where('sourceId').equals(id)
      .or('targetId').equals(id)
      .delete();
    set(state => ({ entities: state.entities.filter(e => e.id !== id) }));
  },

  duplicateEntity: async (id) => {
    const source = get().entities.find(e => e.id === id);
    if (!source) throw new Error('Entity not found');
    const typeEntities = get().entities.filter(e => e.typeId === source.typeId);
    const maxOrder = typeEntities.reduce((m, e) => Math.max(m, e.order ?? 0), 0);
    const copy: Entity = {
      ...source,
      id: uid(),
      name: `${source.name} (Kopie)`,
      order: maxOrder + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      deletedAt: undefined,
    };
    await db.entities.add(copy);
    set(state => ({ entities: [...state.entities, copy] }));
    return copy;
  },

  reorderEntities: async (typeId, orderedIds) => {
    const updates = orderedIds.map((id, idx) => ({ id, order: idx }));
    await db.transaction('rw', db.entities, async () => {
      for (const { id, order } of updates) {
        await db.entities.update(id, { order });
      }
    });
    set(state => ({
      entities: state.entities.map(e => {
        const upd = updates.find(u => u.id === e.id);
        return upd ? { ...e, order: upd.order } : e;
      }),
    }));
  },

  getEntity: (id) => get().entities.find(e => e.id === id),
  getEntitiesByType: (typeId) => get().entities
    .filter(e => e.typeId === typeId)
    .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt)),
}));

// Suppress unused import warning
export type { PropertyValue };
