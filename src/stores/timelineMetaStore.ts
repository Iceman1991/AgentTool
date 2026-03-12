import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid } from '../lib/utils';
import type { Timeline } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface TimelineMetaState {
  timelines: Timeline[];
  loading: boolean;
  load: () => Promise<void>;
  createTimeline: (data?: Partial<Timeline>) => Promise<Timeline>;
  updateTimeline: (id: string, data: Partial<Timeline>) => Promise<void>;
  deleteTimeline: (id: string) => Promise<void>;
}

export const useTimelineMetaStore = create<TimelineMetaState>((set) => ({
  timelines: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const { data } = await supabase.from('timelines').select('*').eq('user_id', userId).order('createdAt', { ascending: true });
    const all = (data ?? []).map(({ user_id: _u, ...t }: any) => t as Timeline);
    set({ timelines: all.filter((t: Timeline) => !t.workspaceId || t.workspaceId === wsId), loading: false });
  },

  createTimeline: async (data = {}) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const now = Date.now();
    const newTimeline: Timeline = {
      id: uid(),
      name: data.name ?? 'Neue Zeitleiste',
      description: data.description,
      filterEntityIds: data.filterEntityIds ?? [],
      filterTags: data.filterTags ?? [],
      color: data.color ?? '#7C3AED',
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('timelines').insert({ ...newTimeline, user_id: userId });
    set(state => ({ timelines: [...state.timelines, newTimeline] }));
    return newTimeline;
  },

  updateTimeline: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('timelines').update(updated).eq('id', id);
    set(state => ({ timelines: state.timelines.map(t => t.id === id ? { ...t, ...updated } : t) }));
  },

  deleteTimeline: async (id) => {
    await supabase.from('timelines').delete().eq('id', id);
    set(state => ({ timelines: state.timelines.filter(t => t.id !== id) }));
  },
}));
