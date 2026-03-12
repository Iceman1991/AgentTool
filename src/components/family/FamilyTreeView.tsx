import { useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { FamilyNode } from './FamilyNode';
import { RelationshipEdge } from '../graph/RelationshipEdge';
import { Select } from '../ui/Select';
import { Users } from 'lucide-react';

const nodeTypes: NodeTypes = { familyNode: FamilyNode };
const edgeTypes: EdgeTypes = { relationshipEdge: RelationshipEdge };

export function FamilyTreeView() {
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const { buildFamilyTreeData, relationships, relationshipTypes } = useRelationshipStore();

  const [rootEntityId, setRootEntityId] = useState<string>('');

  const familialEntityIds = useMemo(() => {
    const ids = new Set<string>();
    for (const rel of relationships) {
      if (rel.isFamilial) {
        ids.add(rel.sourceId);
        ids.add(rel.targetId);
      }
    }
    return ids;
  }, [relationships]);

  const entitiesWithFamily = entities.filter(e => familialEntityIds.has(e.id));

  const graphData = useMemo(
    () => buildFamilyTreeData(entities, entityTypes, rootEntityId || undefined),
    [entities, entityTypes, rootEntityId, buildFamilyTreeData]
  );

  const [nodes, , onNodesChange] = useNodesState(graphData.nodes as never[]);
  const [edges, , onEdgesChange] = useEdgesState(graphData.edges as never[]);

  // Get familial relationship types used in current graph
  const usedRelTypeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of graphData.edges) {
      if (edge.data?.relationshipType?.id) {
        ids.add(edge.data.relationshipType.id);
      }
    }
    return ids;
  }, [graphData.edges]);

  const familialRelTypes = relationshipTypes.filter(rt => rt.isFamilial && usedRelTypeIds.has(rt.id));

  const entityOptions = [
    { value: '', label: 'Alle anzeigen' },
    ...entitiesWithFamily.map(e => ({ value: e.id, label: e.name })),
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <h2 className="font-display text-xl font-semibold text-gray-100">Stammbaum</h2>
        <div className="w-64">
          <Select
            value={rootEntityId}
            onChange={e => setRootEntityId(e.target.value)}
            options={entityOptions}
            placeholder="Ausgangsperson wählen..."
          />
        </div>
        <span className="text-sm text-gray-500">
          {graphData.nodes.length} Personen, {graphData.edges.length} Verbindungen
        </span>
      </div>

      {graphData.nodes.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Users size={48} className="text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">Keine Familien-Beziehungen gefunden</p>
            <p className="text-gray-600 text-sm mt-1">
              Füge Beziehungen vom Typ "Elternteil von" oder "Verheiratet mit" hinzu.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-3">
          {/* Legend */}
          {familialRelTypes.length > 0 && (
            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-gray-500">Legende:</span>
              {familialRelTypes.map(rt => (
                <span key={rt.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-6 h-0.5 rounded"
                    style={{ backgroundColor: rt.color }}
                  />
                  <span style={{ color: rt.color }}>{rt.label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex-1 rounded-xl overflow-hidden border border-gray-700">
            <ReactFlow
              nodes={graphData.nodes as never[]}
              edges={graphData.edges as never[]}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-gray-900"
            >
              <Background
                variant={BackgroundVariant.Dots}
                color="rgba(255,255,255,0.06)"
                gap={20}
                size={1.5}
              />
              <Controls className="[&>button]:bg-gray-800 [&>button]:border-gray-600 [&>button]:text-gray-300" />
              <MiniMap
                className="bg-gray-800 border border-gray-700"
                nodeColor={(n) => {
                  const entity = entities.find(e => e.id === n.id);
                  const et = entityTypes.find(t => t.id === entity?.typeId);
                  return et?.color || '#6B7280';
                }}
              />
            </ReactFlow>
          </div>
        </div>
      )}
    </div>
  );
}
