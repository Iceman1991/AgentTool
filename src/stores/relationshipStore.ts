import { create } from 'zustand';
import dagre from 'dagre';
import { db } from '../db';
import { uid, getNextColor } from '../lib/utils';
import type { Relationship, RelationshipType, Entity, EntityType } from '../types';

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    entity: Entity;
    entityType: EntityType;
    label: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  data: {
    relationship: Relationship;
    relationshipType: RelationshipType | undefined;
    label: string;
  };
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
  buildGraphData: (
    entities: Entity[],
    entityTypes: EntityType[],
    filterEntityTypeIds?: string[],
    filterRelTypeIds?: string[],
    searchQuery?: string,
  ) => { nodes: GraphNode[]; edges: GraphEdge[] };
  buildFamilyTreeData: (
    entities: Entity[],
    entityTypes: EntityType[],
    rootEntityId?: string,
  ) => { nodes: GraphNode[]; edges: GraphEdge[] };
  getRelationshipsByEntity: (entityId: string) => Relationship[];
  syncDeletedEntity: (entityId: string) => void;
}

function applyDagreLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
  direction: 'LR' | 'TB' = 'LR',
  nodeWidth = 200,
  nodeHeight = 80,
): GraphNode[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 120 });

  nodes.forEach(n => g.setNode(n.id, { width: nodeWidth, height: nodeHeight }));
  edges.forEach(e => g.setEdge(e.source, e.target));

  dagre.layout(g);

  return nodes.map(n => {
    const pos = g.node(n.id);
    return {
      ...n,
      position: {
        x: pos ? pos.x - nodeWidth / 2 : 0,
        y: pos ? pos.y - nodeHeight / 2 : 0,
      },
    };
  });
}

export const useRelationshipStore = create<RelationshipState>((set, get) => ({
  relationships: [],
  relationshipTypes: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const [relationships, relationshipTypes] = await Promise.all([
      db.relationships.orderBy('createdAt').toArray(),
      db.relationshipTypes.toArray(),
    ]);
    set({ relationships, relationshipTypes, loading: false });
  },

  createRelationship: async (data) => {
    const relType = get().relationshipTypes.find(rt => rt.id === data.typeId);
    const newRel: Relationship = {
      ...data,
      id: uid(),
      isFamilial: relType?.isFamilial || false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.relationships.add(newRel);
    set(state => ({ relationships: [...state.relationships, newRel] }));
    return newRel;
  },

  updateRelationship: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.relationships.update(id, updated);
    set(state => ({
      relationships: state.relationships.map(r => r.id === id ? { ...r, ...updated } : r),
    }));
  },

  deleteRelationship: async (id) => {
    await db.relationships.delete(id);
    set(state => ({ relationships: state.relationships.filter(r => r.id !== id) }));
  },

  createRelationshipType: async (data) => {
    const usedColors = get().relationshipTypes.map(rt => rt.color);
    const newType: RelationshipType = {
      id: uid(),
      label: data.label || 'Neue Beziehung',
      inverseLabel: data.inverseLabel,
      color: data.color || getNextColor(usedColors),
      direction: data.direction || 'undirected',
      isFamilial: data.isFamilial || false,
    };
    await db.relationshipTypes.add(newType);
    set(state => ({ relationshipTypes: [...state.relationshipTypes, newType] }));
    return newType;
  },

  updateRelationshipType: async (id, data) => {
    await db.relationshipTypes.update(id, data);
    set(state => ({
      relationshipTypes: state.relationshipTypes.map(rt => rt.id === id ? { ...rt, ...data } : rt),
    }));
  },

  deleteRelationshipType: async (id) => {
    await db.relationshipTypes.delete(id);
    set(state => ({
      relationshipTypes: state.relationshipTypes.filter(rt => rt.id !== id),
    }));
  },

  buildGraphData: (entities, entityTypes, filterEntityTypeIds, filterRelTypeIds, searchQuery) => {
    const { relationships, relationshipTypes } = get();

    let filteredEntities = entities;
    if (filterEntityTypeIds && filterEntityTypeIds.length > 0) {
      filteredEntities = filteredEntities.filter(e => filterEntityTypeIds.includes(e.typeId));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredEntities = filteredEntities.filter(e => e.name.toLowerCase().includes(q));
    }

    const entityIds = new Set(filteredEntities.map(e => e.id));

    let filteredRels = relationships.filter(r => entityIds.has(r.sourceId) && entityIds.has(r.targetId));
    if (filterRelTypeIds && filterRelTypeIds.length > 0) {
      filteredRels = filteredRels.filter(r => filterRelTypeIds.includes(r.typeId));
    }

    const entityTypeMap = new Map(entityTypes.map(et => [et.id, et]));

    const nodes: GraphNode[] = filteredEntities.map(entity => ({
      id: entity.id,
      type: 'entityNode',
      position: { x: 0, y: 0 },
      data: {
        entity,
        entityType: entityTypeMap.get(entity.typeId) || {
          id: entity.typeId,
          name: 'Unbekannt',
          slug: 'unknown',
          color: '#6B7280',
          icon: 'Circle',
          properties: [],
          isSystem: false,
          createdAt: 0,
          updatedAt: 0,
        },
        label: entity.name,
      },
    }));

    const relTypeMap = new Map(relationshipTypes.map(rt => [rt.id, rt]));

    const edges: GraphEdge[] = filteredRels.map(rel => {
      const relType = relTypeMap.get(rel.typeId);
      return {
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        type: 'relationshipEdge',
        data: {
          relationship: rel,
          relationshipType: relType,
          label: rel.label || relType?.label || '',
        },
        animated: false,
      };
    });

    const laidOutNodes = nodes.length > 0 ? applyDagreLayout(nodes, edges) : nodes;

    return { nodes: laidOutNodes, edges };
  },

  buildFamilyTreeData: (entities, entityTypes, rootEntityId) => {
    const { relationships, relationshipTypes } = get();

    const familialRels = relationships.filter(r => r.isFamilial);
    const entityIds = new Set(entities.map(e => e.id));

    const connectedIds = new Set<string>();
    if (rootEntityId) {
      // BFS from root
      const queue = [rootEntityId];
      connectedIds.add(rootEntityId);
      while (queue.length > 0) {
        const current = queue.shift()!;
        for (const rel of familialRels) {
          if (rel.sourceId === current && entityIds.has(rel.targetId) && !connectedIds.has(rel.targetId)) {
            connectedIds.add(rel.targetId);
            queue.push(rel.targetId);
          }
          if (rel.targetId === current && entityIds.has(rel.sourceId) && !connectedIds.has(rel.sourceId)) {
            connectedIds.add(rel.sourceId);
            queue.push(rel.sourceId);
          }
        }
      }
    } else {
      // All entities that have familial relationships
      for (const rel of familialRels) {
        if (entityIds.has(rel.sourceId)) connectedIds.add(rel.sourceId);
        if (entityIds.has(rel.targetId)) connectedIds.add(rel.targetId);
      }
    }

    const filteredEntities = entities.filter(e => connectedIds.has(e.id));
    const entityTypeMap = new Map(entityTypes.map(et => [et.id, et]));

    const nodes: GraphNode[] = filteredEntities.map(entity => ({
      id: entity.id,
      type: 'familyNode',
      position: { x: 0, y: 0 },
      data: {
        entity,
        entityType: entityTypeMap.get(entity.typeId) || {
          id: entity.typeId,
          name: 'Unbekannt',
          slug: 'unknown',
          color: '#6B7280',
          icon: 'Circle',
          properties: [],
          isSystem: false,
          createdAt: 0,
          updatedAt: 0,
        },
        label: entity.name,
      },
    }));

    const relTypeMap = new Map(relationshipTypes.map(rt => [rt.id, rt]));
    const filteredIds = new Set(filteredEntities.map(e => e.id));

    const edges: GraphEdge[] = familialRels
      .filter(r => filteredIds.has(r.sourceId) && filteredIds.has(r.targetId))
      .map(rel => {
        const relType = relTypeMap.get(rel.typeId);
        return {
          id: rel.id,
          source: rel.sourceId,
          target: rel.targetId,
          type: 'relationshipEdge',
          data: {
            relationship: rel,
            relationshipType: relType,
            label: rel.label || relType?.label || '',
          },
        };
      });

    const laidOutNodes = nodes.length > 0 ? applyDagreLayout(nodes, edges, 'TB', 180, 240) : nodes;

    return { nodes: laidOutNodes, edges };
  },

  getRelationshipsByEntity: (entityId) => {
    return get().relationships.filter(r => r.sourceId === entityId || r.targetId === entityId);
  },

  syncDeletedEntity: (entityId) => {
    set(state => ({
      relationships: state.relationships.filter(
        r => r.sourceId !== entityId && r.targetId !== entityId
      ),
    }));
  },
}));
