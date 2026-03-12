import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { EntityNode } from './EntityNode';
import { RelationshipEdge } from './RelationshipEdge';
import { GraphControls } from './GraphControls';

const nodeTypes: NodeTypes = { entityNode: EntityNode };
const edgeTypes: EdgeTypes = { relationshipEdge: RelationshipEdge };

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6B7280' },
};

export function RelationshipGraph() {
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const { relationshipTypes, buildGraphData } = useRelationshipStore();

  const [filterEntityTypeIds, setFilterEntityTypeIds] = useState<string[]>([]);
  const [filterRelTypeIds, setFilterRelTypeIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const graphData = useMemo(
    () => buildGraphData(entities, entityTypes, filterEntityTypeIds, filterRelTypeIds, searchQuery),
    [entities, entityTypes, filterEntityTypeIds, filterRelTypeIds, searchQuery, buildGraphData]
  );

  const [nodes, , onNodesChange] = useNodesState(graphData.nodes as never[]);
  const [edges, , onEdgesChange] = useEdgesState(graphData.edges as never[]);

  const toggleEntityType = useCallback((id: string) => {
    setFilterEntityTypeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const toggleRelType = useCallback((id: string) => {
    setFilterRelTypeIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  return (
    <div className="flex h-full gap-4 p-4">
      <GraphControls
        entityTypes={entityTypes}
        relationshipTypes={relationshipTypes}
        filterEntityTypeIds={filterEntityTypeIds}
        filterRelTypeIds={filterRelTypeIds}
        searchQuery={searchQuery}
        onToggleEntityType={toggleEntityType}
        onToggleRelType={toggleRelType}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-700">
        <ReactFlow
          nodes={graphData.nodes as never[]}
          edges={graphData.edges as never[]}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          className="bg-gray-900"
        >
          <Background color="#374151" gap={20} />
          <Controls className="[&>button]:bg-gray-800 [&>button]:border-gray-600 [&>button]:text-gray-300" />
          <MiniMap
            className="bg-gray-800 border border-gray-700"
            nodeColor={n => {
              const entityType = entityTypes.find(et => {
                const entity = entities.find(e => e.id === n.id);
                return entity && et.id === entity.typeId;
              });
              return entityType?.color || '#6B7280';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
