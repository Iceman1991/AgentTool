import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid, compareGolarionDates, COLOR_PALETTE } from '../lib/utils';
import type { TimelineEvent, GolarionDate, EventCategory } from '../types';

interface TimelineState {
  events: TimelineEvent[];
  loading: boolean;
  load: () => Promise<void>;
  createEvent: (data: Partial<TimelineEvent> & { title: string; date: GolarionDate }) => Promise<TimelineEvent>;
  updateEvent: (id: string, data: Partial<TimelineEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEvent: (id: string) => TimelineEvent | undefined;
  getSortedEvents: () => TimelineEvent[];
  getEventsByEntity: (entityId: string) => TimelineEvent[];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const { data } = await supabase.from('timeline_events').select('*').eq('user_id', userId).order('createdAt', { ascending: true });
    const events = (data ?? []).map(({ user_id: _u, ...e }: any) => e as TimelineEvent);
    set({ events, loading: false });
  },

  createEvent: async (data) => {
    const userId = getUserId();
    const newEvent: TimelineEvent = {
      id: uid(),
      title: data.title,
      description: data.description,
      date: data.date,
      endDate: data.endDate,
      category: data.category || 'custom',
      color: data.color || COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
      linkedEntityIds: data.linkedEntityIds || [],
      sessionNumber: data.sessionNumber,
      tags: data.tags || [],
      isSecret: data.isSecret || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await supabase.from('timeline_events').insert({ ...newEvent, user_id: userId });
    set(state => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  updateEvent: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('timeline_events').update(updated).eq('id', id);
    set(state => ({ events: state.events.map(e => e.id === id ? { ...e, ...updated } : e) }));
  },

  deleteEvent: async (id) => {
    await supabase.from('timeline_events').delete().eq('id', id);
    set(state => ({ events: state.events.filter(e => e.id !== id) }));
  },

  getEvent: (id) => get().events.find(e => e.id === id),
  getSortedEvents: () => [...get().events].sort((a, b) => compareGolarionDates(a.date, b.date)),
  getEventsByEntity: (entityId) => get().events.filter(e => e.linkedEntityIds.includes(entityId)),
}));

export type { EventCategory };
