import { create } from 'zustand';
import { db } from '../db';
import { uid } from '../lib/utils';
import type { Timeline } from '../types';

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
    const timelines = await db.timelines.orderBy('createdAt').toArray();
    set({ timelines, loading: false });
  },

  createTimeline: async (data = {}) => {
    const now = Date.now();
    const newTimeline: Timeline = {
      id: uid(),
      name: data.name ?? 'Neue Zeitleiste',
      description: data.description,
      filterEntityIds: data.filterEntityIds ?? [],
      filterTags: data.filterTags ?? [],
      color: data.color ?? '#7C3AED',
      createdAt: now,
      updatedAt: now,
    };
    await db.timelines.add(newTimeline);
    set(state => ({ timelines: [...state.timelines, newTimeline] }));
    return newTimeline;
  },

  updateTimeline: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.timelines.update(id, updated);
    set(state => ({
      timelines: state.timelines.map(t => t.id === id ? { ...t, ...updated } : t),
    }));
  },

  deleteTimeline: async (id) => {
    await db.timelines.delete(id);
    set(state => ({ timelines: state.timelines.filter(t => t.id !== id) }));
  },
}));
