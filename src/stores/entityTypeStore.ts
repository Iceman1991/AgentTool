import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid, generateSlug, generateKey, getNextColor } from '../lib/utils';
import type { EntityType, PropertyDefinition, PropertyType, SelectOption } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface EntityTypeState {
  entityTypes: EntityType[];
  loading: boolean;
  load: () => Promise<void>;
  createEntityType: (data: Partial<EntityType>) => Promise<EntityType>;
  updateEntityType: (id: string, data: Partial<EntityType>) => Promise<void>;
  deleteEntityType: (id: string) => Promise<void>;
  addProperty: (typeId: string, name: string, type: PropertyType) => Promise<PropertyDefinition>;
  updateProperty: (typeId: string, propId: string, data: Partial<PropertyDefinition>) => Promise<void>;
  deleteProperty: (typeId: string, propId: string) => Promise<void>;
  reorderProperties: (typeId: string, orderedIds: string[]) => Promise<void>;
  getEntityType: (id: string) => EntityType | undefined;
  getEntityTypeBySlug: (slug: string) => EntityType | undefined;
}

export const useEntityTypeStore = create<EntityTypeState>((set, get) => ({
  entityTypes: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const { data } = await supabase
      .from('entity_types')
      .select('*')
      .eq('user_id', userId)
      .order('"createdAt"', { ascending: true });
    const all = (data ?? []).map(({ user_id: _u, ...rest }) => rest as EntityType);
    set({ entityTypes: all.filter(t => !t.workspaceId || t.workspaceId === wsId), loading: false });
  },

  createEntityType: async (data) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const usedColors = get().entityTypes.map(t => t.color);
    const newType: EntityType = {
      id: uid(),
      name: data.name || 'Neuer Typ',
      slug: data.slug || generateSlug(data.name || 'neuer-typ'),
      description: data.description,
      color: data.color || getNextColor(usedColors),
      icon: data.icon || 'Circle',
      properties: data.properties || [],
      isSystem: data.isSystem || false,
      workspaceId: wsId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await supabase.from('entity_types').insert({ ...newType, user_id: userId });
    set(state => ({ entityTypes: [...state.entityTypes, newType] }));
    return newType;
  },

  updateEntityType: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('entity_types').update(updated).eq('id', id);
    set(state => ({
      entityTypes: state.entityTypes.map(t => t.id === id ? { ...t, ...updated } : t),
    }));
  },

  deleteEntityType: async (id) => {
    await supabase.from('entity_types').delete().eq('id', id);
    set(state => ({ entityTypes: state.entityTypes.filter(t => t.id !== id) }));
  },

  addProperty: async (typeId, name, type) => {
    const entityType = get().entityTypes.find(t => t.id === typeId);
    if (!entityType) throw new Error('EntityType not found');
    const newProp: PropertyDefinition = {
      id: uid(),
      name,
      key: generateKey(name),
      type,
      required: false,
      options: (type === 'select' || type === 'multiselect') ? [] : undefined,
      order: entityType.properties.length,
    };
    const properties = [...entityType.properties, newProp];
    const updatedAt = Date.now();
    await supabase.from('entity_types').update({ properties, updatedAt }).eq('id', typeId);
    set(state => ({
      entityTypes: state.entityTypes.map(t => t.id === typeId ? { ...t, properties, updatedAt } : t),
    }));
    return newProp;
  },

  updateProperty: async (typeId, propId, data) => {
    const entityType = get().entityTypes.find(t => t.id === typeId);
    if (!entityType) return;
    const properties = entityType.properties.map(p => p.id === propId ? { ...p, ...data } : p);
    const updatedAt = Date.now();
    await supabase.from('entity_types').update({ properties, updatedAt }).eq('id', typeId);
    set(state => ({
      entityTypes: state.entityTypes.map(t => t.id === typeId ? { ...t, properties, updatedAt } : t),
    }));
  },

  deleteProperty: async (typeId, propId) => {
    const entityType = get().entityTypes.find(t => t.id === typeId);
    if (!entityType) return;
    const properties = entityType.properties.filter(p => p.id !== propId);
    const updatedAt = Date.now();
    await supabase.from('entity_types').update({ properties, updatedAt }).eq('id', typeId);
    set(state => ({
      entityTypes: state.entityTypes.map(t => t.id === typeId ? { ...t, properties, updatedAt } : t),
    }));
  },

  reorderProperties: async (typeId, orderedIds) => {
    const entityType = get().entityTypes.find(t => t.id === typeId);
    if (!entityType) return;
    const propMap = new Map(entityType.properties.map(p => [p.id, p]));
    const properties = orderedIds
      .map((id, idx) => { const prop = propMap.get(id); return prop ? { ...prop, order: idx } : null; })
      .filter(Boolean) as PropertyDefinition[];
    const updatedAt = Date.now();
    await supabase.from('entity_types').update({ properties, updatedAt }).eq('id', typeId);
    set(state => ({
      entityTypes: state.entityTypes.map(t => t.id === typeId ? { ...t, properties, updatedAt } : t),
    }));
  },

  getEntityType: (id) => get().entityTypes.find(t => t.id === id),
  getEntityTypeBySlug: (slug) => get().entityTypes.find(t => t.slug === slug),
}));

export type { SelectOption };
