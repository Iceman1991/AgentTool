import { create } from 'zustand';
import { supabase, getUserId } from '../lib/supabase';
import { uid } from '../lib/utils';
import type { CampaignMap, MapPin, MapPinType } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface MapState {
  maps: CampaignMap[];
  pins: MapPin[];
  loading: boolean;
  load: () => Promise<void>;
  createMap: (data: { name: string; imageUrl: string; description?: string }) => Promise<CampaignMap>;
  updateMap: (id: string, data: Partial<CampaignMap>) => Promise<void>;
  deleteMap: (id: string) => Promise<void>;
  createPin: (data: {
    mapId: string;
    x: number;
    y: number;
    label: string;
    description?: string;
    color: string;
    type: MapPinType;
    targetId?: string;
  }) => Promise<MapPin>;
  updatePin: (id: string, data: Partial<MapPin>) => Promise<void>;
  deletePin: (id: string) => Promise<void>;
}

function rowToMap(row: Record<string, unknown>): CampaignMap {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    imageUrl: row.image_url as string,
    workspaceId: row.workspace_id as string | undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

function rowToPin(row: Record<string, unknown>): MapPin {
  return {
    id: row.id as string,
    mapId: row.map_id as string,
    x: row.x as number,
    y: row.y as number,
    label: row.label as string,
    description: row.description as string | undefined,
    color: (row.color as string) ?? '#C49A4A',
    type: (row.type as MapPinType) ?? 'custom',
    targetId: row.target_id as string | undefined,
    workspaceId: row.workspace_id as string | undefined,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
  };
}

export const useMapStore = create<MapState>((set, get) => ({
  maps: [],
  pins: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    try {
      const userId = getUserId();
      const wsId = useWorkspaceStore.getState().currentWorkspaceId;

      const [mapsResult, pinsResult] = await Promise.all([
        supabase
          .from('campaign_maps')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase
          .from('map_pins')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
      ]);

      const allMaps = (mapsResult.data ?? []).map(rowToMap);
      const allPins = (pinsResult.data ?? []).map(rowToPin);

      set({
        maps: allMaps.filter(m => !m.workspaceId || m.workspaceId === wsId),
        pins: allPins.filter(p => !p.workspaceId || p.workspaceId === wsId),
        loading: false,
      });
    } catch (err) {
      console.warn('Maps tables may not exist yet:', err);
      set({ maps: [], pins: [], loading: false });
    }
  },

  createMap: async (data) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const now = Date.now();
    const newMap: CampaignMap = {
      id: uid(),
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('campaign_maps').insert({
      id: newMap.id,
      user_id: userId,
      workspace_id: newMap.workspaceId,
      name: newMap.name,
      description: newMap.description,
      image_url: newMap.imageUrl,
      created_at: newMap.createdAt,
      updated_at: newMap.updatedAt,
    });
    set(state => ({ maps: [...state.maps, newMap] }));
    return newMap;
  },

  updateMap: async (id, data) => {
    const now = Date.now();
    const dbUpdate: Record<string, unknown> = { updated_at: now };
    if (data.name !== undefined) dbUpdate.name = data.name;
    if (data.description !== undefined) dbUpdate.description = data.description;
    if (data.imageUrl !== undefined) dbUpdate.image_url = data.imageUrl;
    await supabase.from('campaign_maps').update(dbUpdate).eq('id', id);
    set(state => ({
      maps: state.maps.map(m =>
        m.id === id ? { ...m, ...data, updatedAt: now } : m
      ),
    }));
  },

  deleteMap: async (id) => {
    await supabase.from('campaign_maps').delete().eq('id', id);
    set(state => ({
      maps: state.maps.filter(m => m.id !== id),
      pins: state.pins.filter(p => p.mapId !== id),
    }));
  },

  createPin: async (data) => {
    const userId = getUserId();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const now = Date.now();
    const newPin: MapPin = {
      id: uid(),
      mapId: data.mapId,
      x: data.x,
      y: data.y,
      label: data.label,
      description: data.description,
      color: data.color,
      type: data.type,
      targetId: data.targetId,
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await supabase.from('map_pins').insert({
      id: newPin.id,
      user_id: userId,
      workspace_id: newPin.workspaceId,
      map_id: newPin.mapId,
      x: newPin.x,
      y: newPin.y,
      label: newPin.label,
      description: newPin.description,
      color: newPin.color,
      type: newPin.type,
      target_id: newPin.targetId,
      created_at: newPin.createdAt,
      updated_at: newPin.updatedAt,
    });
    set(state => ({ pins: [...state.pins, newPin] }));
    return newPin;
  },

  updatePin: async (id, data) => {
    const now = Date.now();
    const dbUpdate: Record<string, unknown> = { updated_at: now };
    if (data.label !== undefined) dbUpdate.label = data.label;
    if (data.description !== undefined) dbUpdate.description = data.description;
    if (data.color !== undefined) dbUpdate.color = data.color;
    if (data.type !== undefined) dbUpdate.type = data.type;
    if (data.targetId !== undefined) dbUpdate.target_id = data.targetId;
    if (data.x !== undefined) dbUpdate.x = data.x;
    if (data.y !== undefined) dbUpdate.y = data.y;
    await supabase.from('map_pins').update(dbUpdate).eq('id', id);
    set(state => ({
      pins: state.pins.map(p =>
        p.id === id ? { ...p, ...data, updatedAt: now } : p
      ),
    }));
  },

  deletePin: async (id) => {
    await supabase.from('map_pins').delete().eq('id', id);
    set(state => ({ pins: state.pins.filter(p => p.id !== id) }));
  },
}));
