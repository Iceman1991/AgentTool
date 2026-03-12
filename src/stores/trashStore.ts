import { create } from 'zustand';
import { db } from '../db';
import type { Entity, NotePage } from '../types';
import { useEntityStore } from './entityStore';
import { useNotePageStore } from './notePageStore';
import { useRelationshipStore } from './relationshipStore';

interface TrashState {
  trashedEntities: Entity[];
  trashedPages: NotePage[];
  loading: boolean;
  load: () => Promise<void>;
  restoreEntity: (id: string) => Promise<void>;
  restoreNotePage: (id: string) => Promise<void>;
  permanentDeleteEntity: (id: string) => Promise<void>;
  permanentDeleteNotePage: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

export const useTrashStore = create<TrashState>((set) => ({
  trashedEntities: [],
  trashedPages: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const [allEntities, allPages] = await Promise.all([
      db.entities.toArray(),
      db.notePages.toArray(),
    ]);
    set({
      trashedEntities: allEntities.filter(e => !!e.deletedAt),
      trashedPages: allPages.filter(p => !!p.deletedAt),
      loading: false,
    });
  },

  restoreEntity: async (id) => {
    await db.entities.update(id, { deletedAt: 0 });
    set(s => ({ trashedEntities: s.trashedEntities.filter(e => e.id !== id) }));
    await useEntityStore.getState().load();
  },

  restoreNotePage: async (id) => {
    await db.notePages.update(id, { deletedAt: 0 });
    set(s => ({ trashedPages: s.trashedPages.filter(p => p.id !== id) }));
    await useNotePageStore.getState().load();
  },

  permanentDeleteEntity: async (id) => {
    await db.entities.delete(id);
    await db.relationships
      .where('sourceId').equals(id)
      .or('targetId').equals(id)
      .delete();
    useRelationshipStore.getState().syncDeletedEntity(id);
    set(s => ({ trashedEntities: s.trashedEntities.filter(e => e.id !== id) }));
  },

  permanentDeleteNotePage: async (id) => {
    await db.notePages.delete(id);
    set(s => ({ trashedPages: s.trashedPages.filter(p => p.id !== id) }));
  },

  emptyTrash: async () => {
    const { trashedEntities, trashedPages } = useTrashStore.getState();
    // Permanently delete all entities and cascade relationships
    for (const e of trashedEntities) {
      await db.entities.delete(e.id);
      await db.relationships
        .where('sourceId').equals(e.id)
        .or('targetId').equals(e.id)
        .delete();
      useRelationshipStore.getState().syncDeletedEntity(e.id);
    }
    // Permanently delete all pages
    await db.notePages.bulkDelete(trashedPages.map(p => p.id));
    set({ trashedEntities: [], trashedPages: [] });
    await useRelationshipStore.getState().load();
  },
}));
