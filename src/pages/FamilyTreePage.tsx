import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Trash2, ChevronLeft } from 'lucide-react';
import { useEntityStore } from '../stores/entityStore';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useRelationshipStore } from '../stores/relationshipStore';
import { useFamilyTreeStore } from '../stores/familyTreeStore';
import { FamilyNode } from '../components/family/FamilyNode';
import { RelationshipEdge } from '../components/graph/RelationshipEdge';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { NotFoundPage } from './NotFoundPage';

const nodeTypes: NodeTypes = { familyNode: FamilyNode };
const edgeTypes: EdgeTypes = { relationshipEdge: RelationshipEdge };

export function FamilyTreePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { familyTrees, updateFamilyTree, deleteFamilyTree } = useFamilyTreeStore();
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const { buildFamilyTreeData, relationships, relationshipTypes } = useRelationshipStore();

  const tree = familyTrees.find(t => t.id === id);

  const [nameValue, setNameValue] = useState(tree?.name ?? '');
  const [descValue, setDescValue] = useState(tree?.description ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (tree) {
      setNameValue(tree.name);
      setDescValue(tree.description ?? '');
    }
  }, [tree?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tree) return;
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(() => {
      if (nameValue !== tree.name) updateFamilyTree(tree.id, { name: nameValue });
    }, 500);
    return () => { if (nameDebounce.current) clearTimeout(nameDebounce.current); };
  }, [nameValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tree) return;
    if (descDebounce.current) clearTimeout(descDebounce.current);
    descDebounce.current = setTimeout(() => {
      if (descValue !== (tree.description ?? '')) updateFamilyTree(tree.id, { description: descValue });
    }, 500);
    return () => { if (descDebounce.current) clearTimeout(descDebounce.current); };
  }, [descValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Each tree stores its own rootEntityId independently
  const rootEntityId = tree?.rootEntityId ?? '';

  const handleRootEntityChange = (newId: string) => {
    if (!tree) return;
    updateFamilyTree(tree.id, { rootEntityId: newId || undefined });
  };

  // Key that forces ReactFlow to fully remount when tree or root changes
  const flowKey = `${id}-${rootEntityId}`;

  const handleDelete = async () => {
    if (!tree) return;
    await deleteFamilyTree(tree.id);
    navigate('/family-tree');
  };

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

  if (!tree) return <NotFoundPage />;

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/family-tree')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={14} />
          Alle Stammbäume
        </button>
        <span className="text-gray-700">/</span>
        <input
          type="text"
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          className="font-display text-lg font-semibold text-gray-100 bg-transparent outline-none border-none min-w-0 flex-1"
          placeholder="Stammbaum-Name..."
        />
        <input
          type="text"
          value={descValue}
          onChange={e => setDescValue(e.target.value)}
          className="text-sm text-gray-500 bg-transparent outline-none border-none min-w-0 w-48 hidden sm:block"
          placeholder="Beschreibung..."
        />
        <div className="w-full sm:w-56">
          <Select
            value={rootEntityId}
            onChange={e => handleRootEntityChange(e.target.value)}
            options={entityOptions}
            placeholder="Ausgangsperson wählen..."
          />
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
          Löschen
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col h-full gap-3 p-4">
          {!rootEntityId ? (
            // No root selected: show picker prompt
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="text-5xl mb-4">🌳</div>
                <p className="text-gray-200 text-lg font-semibold mb-1">Stammbaum konfigurieren</p>
                <p className="text-gray-500 text-sm mb-6">
                  Wähle eine Wurzel-Person, von der aus der Stammbaum aufgebaut wird.
                  Jeder Stammbaum kann eine andere Wurzel haben.
                </p>
                <Select
                  label=""
                  value={rootEntityId}
                  onChange={e => handleRootEntityChange(e.target.value)}
                  options={[
                    { value: '', label: 'Wurzel-Person wählen...' },
                    ...entitiesWithFamily.map(e => ({ value: e.id, label: e.name })),
                  ]}
                  className="text-center"
                />
                {entitiesWithFamily.length === 0 && (
                  <p className="text-gray-600 text-xs mt-3">
                    Noch keine Familien-Beziehungen angelegt. Verbinde NPCs mit "Elternteil von" oder "Verheiratet mit".
                  </p>
                )}
              </div>
            </div>
          ) : graphData.nodes.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg">Keine Familien-Beziehungen gefunden</p>
                <p className="text-gray-600 text-sm mt-1">
                  Füge Beziehungen vom Typ "Elternteil von" oder "Verheiratet mit" hinzu.
                </p>
              </div>
            </div>
          ) : (
            <>
              {familialRelTypes.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400 flex-shrink-0">
                  <span className="font-semibold uppercase tracking-wider text-gray-500">Legende:</span>
                  {familialRelTypes.map(rt => (
                    <span key={rt.id} className="flex items-center gap-1.5">
                      <span className="inline-block w-6 h-0.5 rounded" style={{ backgroundColor: rt.color }} />
                      <span style={{ color: rt.color }}>{rt.label}</span>
                    </span>
                  ))}
                  <span className="text-sm text-gray-500">
                    {graphData.nodes.length} Personen, {graphData.edges.length} Verbindungen
                  </span>
                </div>
              )}
              <div className="flex-1 rounded-xl overflow-hidden border border-gray-700">
                <ReactFlow
                  key={flowKey}
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
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Stammbaum löschen"
        message={`Möchtest du den Stammbaum "${tree.name}" wirklich löschen?`}
      />
    </div>
  );
}
