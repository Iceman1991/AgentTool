import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
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
    const userId = getUserId();
    const [{ data: eData }, { data: pData }] = await Promise.all([
      supabase.from('entities').select('*').eq('user_id', userId).not('deletedAt', 'is', null),
      supabase.from('note_pages').select('*').eq('user_id', userId).not('deletedAt', 'is', null),
    ]);
    set({
      trashedEntities: (eData ?? []).map(({ user_id: _u, ...e }: any) => e as Entity),
      trashedPages: (pData ?? []).map(({ user_id: _u, ...p }: any) => p as NotePage),
      loading: false,
    });
  },

  restoreEntity: async (id) => {
    await supabase.from('entities').update({ deletedAt: null }).eq('id', id);
    set(s => ({ trashedEntities: s.trashedEntities.filter(e => e.id !== id) }));
    await useEntityStore.getState().load();
  },

  restoreNotePage: async (id) => {
    await supabase.from('note_pages').update({ deletedAt: null }).eq('id', id);
    set(s => ({ trashedPages: s.trashedPages.filter(p => p.id !== id) }));
    await useNotePageStore.getState().load();
  },

  permanentDeleteEntity: async (id) => {
    await supabase.from('relationships').delete().or(`sourceId.eq.${id},targetId.eq.${id}`);
    await supabase.from('entities').delete().eq('id', id);
    useRelationshipStore.getState().syncDeletedEntity(id);
    set(s => ({ trashedEntities: s.trashedEntities.filter(e => e.id !== id) }));
  },

  permanentDeleteNotePage: async (id) => {
    await supabase.from('note_pages').delete().eq('id', id);
    set(s => ({ trashedPages: s.trashedPages.filter(p => p.id !== id) }));
  },

  emptyTrash: async () => {
    const state = useTrashStore.getState();
    for (const e of state.trashedEntities) {
      await supabase.from('relationships').delete().or(`sourceId.eq.${e.id},targetId.eq.${e.id}`);
      await supabase.from('entities').delete().eq('id', e.id);
      useRelationshipStore.getState().syncDeletedEntity(e.id);
    }
    await Promise.all(state.trashedPages.map((p: NotePage) => supabase.from('note_pages').delete().eq('id', p.id)));
    set({ trashedEntities: [], trashedPages: [] });
    await useRelationshipStore.getState().load();
  },
}));
