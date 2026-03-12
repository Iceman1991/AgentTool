import { create } from 'zustand';
import dagre from 'dagre';
import { supabase, getUserId } from '../lib/supabase';
import { uid, getNextColor } from '../lib/utils';
import type { Relationship, RelationshipType, Entity, EntityType } from '../types';

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { entity: Entity; entityType: EntityType; label: string };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: { relationship: Relationship; relationshipType: RelationshipType | undefined; label: string };
  markerEnd?: object;
  animated?: boolean;
}

interface RelationshipState {
  relationships: Relationship[];
  relationshipTypes: RelationshipType[];
  loading: boolean;
  load: () => Promise<void>;
  createRelationship: (data: Omit<Relationship, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Relationship>;
  updateRelationship: (id: string, data: Partial<Relationship>) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;
  createRelationshipType: (data: Partial<RelationshipType>) => Promise<RelationshipType>;
  updateRelationshipType: (id: string, data: Partial<RelationshipType>) => Promise<void>;
  deleteRelationshipType: (id: string) => Promise<void>;
  buildGraphData: (entities: Entity[], entityTypes: EntityType[], filterEntityTypeIds?: string[], filterRelTypeIds?: string[], searchQuery?: string) => { nodes: GraphNode[]; edges: GraphEdge[] };
  buildFamilyTreeData: (entities: Entity[], entityTypes: EntityType[], rootEntityId?: string) => { nodes: GraphNode[]; edges: GraphEdge[] };
  getRelationshipsByEntity: (entityId: string) => Relationship[];
  syncDeletedEntity: (entityId: string) => void;
}

function applyDagreLayout(nodes: GraphNode[], edges: GraphEdge[], direction: 'LR' | 'TB' = 'LR', nodeWidth = 200, nodeHeight = 80): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });
  nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach(e => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return nodes.map(n => {
    const pos = g.node(n.id);
    return { ...n, position: { x: pos ? pos.x - nodeWidth / 2 : 0, y: pos ? pos.y - nodeHeight / 2 : 0 } };
  });
}

const FALLBACK_TYPE: EntityType = { id: '', name: 'Unbekannt', slug: 'unknown', color: '#6B7280', icon: 'Circle', properties: [], isSystem: false, createdAt: 0, updatedAt: 0 };

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  relationships: [],
  relationshipTypes: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const userId = getUserId();
    const [{ data: relData }, { data: rtData }] = await Promise.all([
      supabase.from('relationships').select('*').eq('user_id', userId).order('createdAt', { ascending: true }),
      supabase.from('relationship_types').select('*').eq('user_id', userId),
    ]);
    const relationships = (relData ?? []).map(({ user_id: _u, ...r }: any) => r as Relationship);
    const relationshipTypes = (rtData ?? []).map(({ user_id: _u, ...r }: any) => r as RelationshipType);
    set({ relationships, relationshipTypes, loading: false });
  },

  createRelationship: async (data) => {
    const userId = getUserId();
    const relType = get().relationshipTypes.find(rt => rt.id === data.typeId);
    const newRel: Relationship = { ...data, id: uid(), isFamilial: relType?.isFamilial || false, createdAt: Date.now(), updatedAt: Date.now() };
    await supabase.from('relationships').insert({ ...newRel, user_id: userId });
    set(state => ({ relationships: [...state.relationships, newRel] }));
    return newRel;
  },

  updateRelationship: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await supabase.from('relationships').update(updated).eq('id', id);
    set(state => ({ relationships: state.relationships.map(r => r.id === id ? { ...r, ...updated } : r) }));
  },

  deleteRelationship: async (id) => {
    await supabase.from('relationships').delete().eq('id', id);
    set(state => ({ relationships: state.relationships.filter(r => r.id !== id) }));
  },

  createRelationshipType: async (data) => {
    const userId = getUserId();
    const usedColors = get().relationshipTypes.map(rt => rt.color);
    const newType: RelationshipType = {
      id: uid(),
      label: data.label || 'Neue Beziehung',
      inverseLabel: data.inverseLabel,
      color: data.color || getNextColor(usedColors),
      direction: data.direction || 'undirected',
      isFamilial: data.isFamilial || false,
    };
    await supabase.from('relationship_types').insert({ ...newType, user_id: userId });
    set(state => ({ relationshipTypes: [...state.relationshipTypes, newType] }));
    return newType;
  },

  updateRelationshipType: async (id, data) => {
    await supabase.from('relationship_types').update(data).eq('id', id);
    set(state => ({ relationshipTypes: state.relationshipTypes.map(rt => rt.id === id ? { ...rt, ...data } : rt) }));
  },

  deleteRelationshipType: async (id) => {
    await supabase.from('relationship_types').delete().eq('id', id);
    set(state => ({ relationshipTypes: state.relationshipTypes.filter(rt => rt.id !== id) }));
  },

  buildGraphData: (entities, entityTypes, filterEntityTypeIds, filterRelTypeIds, searchQuery) => {
    const { relationships, relationshipTypes } = get();
    let fe = entities;
    if (filterEntityTypeIds?.length) fe = fe.filter(e => filterEntityTypeIds.includes(e.typeId));
    if (searchQuery) { const q = searchQuery.toLowerCase(); fe = fe.filter(e => e.name.toLowerCase().includes(q)); }
    const eIds = new Set(fe.map(e => e.id));
    let rels = relationships.filter(r => eIds.has(r.sourceId) && eIds.has(r.targetId));
    if (filterRelTypeIds?.length) rels = rels.filter(r => filterRelTypeIds.includes(r.typeId));
    const etMap = new Map(entityTypes.map(et => [et.id, et]));
    const rtMap = new Map(relationshipTypes.map(rt => [rt.id, rt]));
    const nodes: GraphNode[] = fe.map(entity => ({
      id: entity.id, type: 'entityNode', position: { x: 0, y: 0 },
      data: { entity, entityType: etMap.get(entity.typeId) || FALLBACK_TYPE, label: entity.name },
    }));
    const edges: GraphEdge[] = rels.map(rel => {
      const relType = rtMap.get(rel.typeId);
      return { id: rel.id, source: rel.sourceId, target: rel.targetId, type: 'relationshipEdge', data: { relationship: rel, relationshipType: relType, label: rel.label || relType?.label || '' }, animated: false };
    });
    return { nodes: nodes.length > 0 ? applyDagreLayout(nodes, edges) : nodes, edges };
  },

  buildFamilyTreeData: (entities, entityTypes, rootEntityId) => {
    const { relationships, relationshipTypes } = get();
    const familialRels = relationships.filter(r => r.isFamilial);
    const eIds = new Set(entities.map(e => e.id));
    const connectedIds = new Set<string>();
    if (rootEntityId) {
      const queue = [rootEntityId];
      connectedIds.add(rootEntityId);
      while (queue.length > 0) {
        const cur = queue.shift()!;
        for (const rel of familialRels) {
          if (rel.sourceId === cur && eIds.has(rel.targetId) && !connectedIds.has(rel.targetId)) { connectedIds.add(rel.targetId); queue.push(rel.targetId); }
          if (rel.targetId === cur && eIds.has(rel.sourceId) && !connectedIds.has(rel.sourceId)) { connectedIds.add(rel.sourceId); queue.push(rel.sourceId); }
        }
      }
    } else {
      for (const rel of familialRels) {
        if (eIds.has(rel.sourceId)) connectedIds.add(rel.sourceId);
        if (eIds.has(rel.targetId)) connectedIds.add(rel.targetId);
      }
    }
    const fe2 = entities.filter(e => connectedIds.has(e.id));
    const etMap2 = new Map(entityTypes.map(et => [et.id, et]));
    const rtMap2 = new Map(relationshipTypes.map(rt => [rt.id, rt]));
    const fIds = new Set(fe2.map(e => e.id));
    const nodes2: GraphNode[] = fe2.map(entity => ({
      id: entity.id, type: 'familyNode', position: { x: 0, y: 0 },
      data: { entity, entityType: etMap2.get(entity.typeId) || FALLBACK_TYPE, label: entity.name },
    }));
    const edges2: GraphEdge[] = familialRels
      .filter(r => fIds.has(r.sourceId) && fIds.has(r.targetId))
      .map(rel => { const relType = rtMap2.get(rel.typeId); return { id: rel.id, source: rel.sourceId, target: rel.targetId, type: 'relationshipEdge', data: { relationship: rel, relationshipType: relType, label: rel.label || relType?.label || '' } }; });
    return { nodes: nodes2.length > 0 ? applyDagreLayout(nodes2, edges2, 'TB', 180, 240) : nodes2, edges: edges2 };
  },

  getRelationshipsByEntity: (entityId) => get().relationships.filter(r => r.sourceId === entityId || r.targetId === entityId),
  syncDeletedEntity: (entityId) => set(state => ({ relationships: state.relationships.filter(r => r.sourceId !== entityId && r.targetId !== entityId) })),
}));
