import { create } from 'zustand';
import { db } from '../db';
import { uid, compareGolarionDates } from '../lib/utils';
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
    const events = await db.timelineEvents.orderBy('createdAt').toArray();
    set({ events, loading: false });
  },

  createEvent: async (data) => {
    const newEvent: TimelineEvent = {
      id: uid(),
      title: data.title,
      description: data.description,
      date: data.date,
      endDate: data.endDate,
      category: data.category || 'custom',
      linkedEntityIds: data.linkedEntityIds || [],
      sessionNumber: data.sessionNumber,
      tags: data.tags || [],
      isSecret: data.isSecret || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.timelineEvents.add(newEvent);
    set(state => ({ events: [...state.events, newEvent] }));
    return newEvent;
  },

  updateEvent: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.timelineEvents.update(id, updated);
    set(state => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updated } : e),
    }));
  },

  deleteEvent: async (id) => {
    await db.timelineEvents.delete(id);
    set(state => ({ events: state.events.filter(e => e.id !== id) }));
  },

  getEvent: (id) => get().events.find(e => e.id === id),

  getSortedEvents: () => {
    return [...get().events].sort((a, b) => compareGolarionDates(a.date, b.date));
  },

  getEventsByEntity: (entityId) => {
    return get().events.filter(e => e.linkedEntityIds.includes(entityId));
  },
}));

// Suppress unused import warning
export type { EventCategory };
