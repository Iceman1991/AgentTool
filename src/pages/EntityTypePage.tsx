import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Network, FolderPlus, ChevronDown, ChevronRight, Pencil, Trash2, Check, X, Folder, GripVertical } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { EntityGrid } from '../components/entity/EntityGrid';
import { EntityTable } from '../components/entity/EntityTable';
import { NotFoundPage } from './NotFoundPage';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useEntityStore } from '../stores/entityStore';
import { useEntityFolderStore } from '../stores/entityFolderStore';
import { useUIStore } from '../stores/uiStore';
import type { Entity, EntityFolder, EntityType, EntityViewMode } from '../types';
import { cn } from '../lib/utils';

const VIEW_TABS = [
  { id: 'grid', label: 'Karten', icon: <LayoutGrid size={14} /> },
  { id: 'table', label: 'Tabelle', icon: <List size={14} /> },
];

// ── FolderSection ────────────────────────────────────────────────────────────

interface FolderSectionProps {
  folder: EntityFolder | null; // null = "Ungrouped"
  entities: Entity[];
  entityType: EntityType;
  entityTypes: EntityType[];
  viewMode: EntityViewMode;
  folders: EntityFolder[];
  onCreateEntity: () => void;
  onRenameFolder?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string) => void;
  onMoveEntity: (entityId: string, folderId: string | null) => void;
}

function FolderSection({
  folder,
  entities,
  entityType,
  entityTypes,
  viewMode,
  folders,
  onCreateEntity,
  onRenameFolder,
  onDeleteFolder,
  onMoveEntity,
}: FolderSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(folder?.name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleRename = () => {
    if (folder && editName.trim()) {
      onRenameFolder?.(folder.id, editName.trim());
    }
    setEditing(false);
  };

  const title = folder ? folder.name : 'Ohne Ordner';
  const isDefault = folder === null;

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center gap-2 group">
        <button
          className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-gray-100 flex-1 min-w-0"
          onClick={() => setCollapsed(c => !c)}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          {!isDefault && <Folder size={14} className="text-gray-500 flex-shrink-0" />}
          {editing ? (
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditing(false);
              }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-800 border border-accent-500 rounded px-1.5 py-0.5 text-sm text-gray-100 focus:outline-none w-32 sm:w-40"
            />
          ) : (
            <span className="truncate">{title}</span>
          )}
          <span className="text-xs text-gray-600 font-normal ml-1">({entities.length})</span>
        </button>

        {/* Folder actions */}
        {!isDefault && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {editing ? (
              <>
                <button
                  className="p-1 rounded hover:bg-gray-700 text-green-400"
                  onClick={handleRename}
                  title="Bestätigen"
                >
                  <Check size={12} />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-700 text-gray-400"
                  onClick={() => setEditing(false)}
                  title="Abbrechen"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <>
                <button
                  className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  onClick={() => { setEditName(folder!.name); setEditing(true); }}
                  title="Umbenennen"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                  onClick={() => {
                    if (window.confirm(`Ordner "${folder!.name}" löschen? Einträge werden nicht gelöscht.`)) {
                      onDeleteFolder?.(folder!.id);
                    }
                  }}
                  title="Ordner löschen"
                >
                  <Trash2 size={12} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="pl-4 border-l border-white/[0.05]">
          {viewMode === 'grid' ? (
            <EntityGridWithFolderMenu
              entities={entities}
              entityType={entityType}
              entityTypes={entityTypes}
              folders={folders}
              currentFolderId={folder?.id ?? null}
              onCreateEntity={onCreateEntity}
              onMoveEntity={onMoveEntity}
            />
          ) : (
            <EntityTableWithFolderMenu
              entities={entities}
              entityTypes={entityTypes}
              folders={folders}
              currentFolderId={folder?.id ?? null}
              onCreateEntity={onCreateEntity}
              onMoveEntity={onMoveEntity}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── EntityGridWithFolderMenu ──────────────────────────────────────────────────

interface FolderMenuProps {
  entities: Entity[];
  entityType?: EntityType;
  entityTypes: EntityType[];
  folders: EntityFolder[];
  currentFolderId: string | null;
  onCreateEntity?: () => void;
  onMoveEntity: (entityId: string, folderId: string | null) => void;
}

interface SortableCardProps {
  entity: Entity;
  entityTypes: EntityType[];
  folders: EntityFolder[];
  onMoveEntity: (entityId: string, folderId: string | null) => void;
  onDuplicate: (entityId: string) => void;
}

const SortableEntityCard = memo(function SortableEntityCard({ entity, entityTypes, folders, onMoveEntity, onDuplicate }: SortableCardProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const et = entityTypes.find(t => t.id === entity.typeId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  if (!et) return null;

  return (
    <div ref={setNodeRef} style={style} className="relative group/card">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded bg-gray-900/80 border border-gray-700 text-gray-400 hover:text-gray-200"
        onClick={e => e.stopPropagation()}
        title="Ziehen zum Sortieren"
      >
        <GripVertical size={12} />
      </div>

      {/* Entity card — click to navigate */}
      <div className="cursor-pointer h-full" onClick={() => navigate(`/entities/${entity.id}`)}>
        <EntityCardInner entity={entity} entityType={et} />
      </div>

      {/* Context menu button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
        <div className="relative">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-900/90 border border-gray-700 text-xs text-gray-300 hover:text-gray-100 hover:border-gray-500"
            onClick={e => { e.stopPropagation(); setIsMenuOpen(v => !v); }}
            title="Optionen"
          >
            ···
          </button>
          {isMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl min-w-[160px] z-20"
              onClick={e => e.stopPropagation()}
            >
              <div className="py-1">
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex items-center gap-2 text-gray-300"
                  onClick={() => { onDuplicate(entity.id); setIsMenuOpen(false); }}
                >
                  <Copy size={11} /> Duplizieren
                </button>
                {folders.length > 0 && (
                  <>
                    <div className="border-t border-gray-700/50 my-1" />
                    <p className="px-3 py-1 text-[10px] text-gray-600 uppercase tracking-wider">Ordner</p>
                    <button
                      className={cn('w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex items-center gap-2', !entity.folderId ? 'text-accent-400' : 'text-gray-400')}
                      onClick={() => { onMoveEntity(entity.id, null); setIsMenuOpen(false); }}
                    >
                      <X size={11} /> Kein Ordner
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id}
                        className={cn('w-full text-left px-3 py-2 text-xs hover:bg-gray-800 flex items-center gap-2', entity.folderId === f.id ? 'text-accent-400' : 'text-gray-300')}
                        onClick={() => { onMoveEntity(entity.id, f.id); setIsMenuOpen(false); }}
                      >
                        <Folder size={11} /> {f.name}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const EntityGridWithFolderMenu = memo(function EntityGridWithFolderMenu({ entities, entityType, entityTypes, folders, currentFolderId, onCreateEntity, onMoveEntity }: FolderMenuProps) {
  const [localEntities, setLocalEntities] = useState<Entity[]>(entities);
  const reorderEntities = useEntityStore(s => s.reorderEntities);
  const duplicateEntity = useEntityStore(s => s.duplicateEntity);
  const navigate = useNavigate();

  useEffect(() => { setLocalEntities(entities); }, [entities]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalEntities(prev => {
        const oldIdx = prev.findIndex(e => e.id === active.id);
        const newIdx = prev.findIndex(e => e.id === over.id);
        const reordered = arrayMove(prev, oldIdx, newIdx);
        reorderEntities(reordered[0].typeId, reordered.map(e => e.id));
        return reordered;
      });
    }
  }, [reorderEntities]);

  const handleDuplicate = useCallback(async (id: string) => {
    const copy = await duplicateEntity(id);
    navigate(`/entities/${copy.id}`);
  }, [duplicateEntity, navigate]);

  if (localEntities.length === 0) {
    return <p className="text-sm text-gray-600 italic py-2">Keine Einträge.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={localEntities.map(e => e.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {localEntities.map(entity => (
            <SortableEntityCard
              key={entity.id}
              entity={entity}
              entityTypes={entityTypes}
              folders={folders}
              onMoveEntity={onMoveEntity}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
});

function EntityTableWithFolderMenu({ entities, entityTypes, folders, currentFolderId, onCreateEntity, onMoveEntity }: FolderMenuProps) {
  if (entities.length === 0) return <p className="text-sm text-gray-600 italic py-2">Keine Einträge.</p>;
  return (
    <EntityTable
      entities={entities}
      entityTypes={entityTypes}
      onCreateEntity={onCreateEntity}
    />
  );
}

// ── Minimal entity card (avoid importing EntityCard which uses its own navigation) ──

import { Copy, Tag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ImagePositionEditor } from '../components/ui/ImagePositionEditor';
import { useEntityStore as useEntityStoreLocal } from '../stores/entityStore';
import type { ImagePosition } from '../types';

const EntityCardInner = memo(function EntityCardInner({ entity, entityType }: { entity: Entity; entityType: EntityType }) {
  const updateEntity = useEntityStoreLocal(s => s.updateEntity);

  const handleSavePosition = useCallback((pos: ImagePosition) => {
    updateEntity(entity.id, { imagePosition: pos });
  }, [entity.id, updateEntity]);

  return (
    <Card className="flex flex-col gap-0 p-0 overflow-hidden h-full" hoverable>
      {entity.imageUrl ? (
        <div className="h-52 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <ImagePositionEditor
            src={entity.imageUrl}
            alt={entity.name}
            position={entity.imagePosition}
            onSave={handleSavePosition}
            className="h-full"
            editButtonLabel="Verschieben"
          />
        </div>
      ) : (
        <div className="h-1.5 flex-shrink-0" style={{ backgroundColor: entityType.color }} />
      )}
      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-100 leading-snug">{entity.name}</h3>
          <Badge color={entityType.color} size="sm" className="flex-shrink-0">{entityType.name}</Badge>
        </div>
        {entity.tags.length > 0 && (
          <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
            {entity.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Tag size={9} /> {tag}
              </span>
            ))}
            {entity.tags.length > 3 && <span className="text-xs text-gray-600">+{entity.tags.length - 3}</span>}
          </div>
        )}
      </div>
    </Card>
  );
});

// ── Main Page ─────────────────────────────────────────────────────────────────

export function EntityTypePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const entityType = useEntityTypeStore(
    useShallow(s => s.entityTypes.find(t => t.slug === slug))
  );
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const updateEntity = useEntityStore(s => s.updateEntity);
  const openModal = useUIStore(s => s.openModal);
  const { entityViewMode, setEntityViewMode } = useUIStore();
  const { getFoldersByType, createFolder, updateFolder, deleteFolder } = useEntityFolderStore();

  const typeId = entityType?.id;

  // Subscribe only to entities of this type — re-renders only when these entities change
  const typeEntities = useEntityStore(
    useShallow(s =>
      !typeId ? [] : s.entities
        .filter(e => e.typeId === typeId)
        .sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt))
    )
  );

  const [newFolderName, setNewFolderName] = useState('');
  const [addingFolder, setAddingFolder] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingFolder) newFolderInputRef.current?.focus();
  }, [addingFolder]);

  if (!entityType) return <NotFoundPage />;

  const folders = getFoldersByType(entityType.id);

  const handleCreateEntity = useCallback(() => {
    openModal({ type: 'createEntity', payload: { entityTypeId: entityType.id } });
  }, [openModal, entityType.id]);

  const handleMoveEntity = useCallback((entityId: string, folderId: string | null) => {
    updateEntity(entityId, { folderId: folderId ?? undefined });
  }, [updateEntity]);

  const handleAddFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    await createFolder(entityType.id, newFolderName.trim());
    setNewFolderName('');
    setAddingFolder(false);
  }, [newFolderName, createFolder, entityType.id]);

  // Group entities — only recomputed when typeEntities or folders change
  const ungrouped = useMemo(() => typeEntities.filter(e => !e.folderId), [typeEntities]);
  const grouped = useMemo(() => folders.map(f => ({
    folder: f,
    entities: typeEntities.filter(e => e.folderId === f.id),
  })), [folders, typeEntities]);

  const hasFolders = folders.length > 0;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: entityType.color + '22' }}
          >
            <div style={{ color: entityType.color }} className="font-bold text-lg">
              {entityType.name[0]}
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-100">{entityType.name}</h1>
            {entityType.description && (
              <p className="text-sm text-gray-500">{entityType.description}</p>
            )}
          </div>
          <span
            className="text-sm px-3 py-1 rounded-full font-medium"
            style={{ backgroundColor: entityType.color + '22', color: entityType.color }}
          >
            {typeEntities.length} Einträge
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Tabs
            tabs={VIEW_TABS}
            activeTab={entityViewMode}
            onChange={id => setEntityViewMode(id as EntityViewMode)}
          />
          <Button variant="ghost" size="sm" onClick={() => navigate('/graph')} title="Graph">
            <Network size={14} /> <span className="hidden sm:inline">Graph</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingFolder(true)}
            title="Neuer Ordner"
          >
            <FolderPlus size={14} /> <span className="hidden sm:inline">Ordner</span>
          </Button>
          <Button variant="primary" onClick={handleCreateEntity}>
            <Plus size={16} /> <span className="hidden xs:inline">Neuer </span>{entityType.name}
          </Button>
        </div>
      </div>

      {/* New folder input */}
      {addingFolder && (
        <div className="flex items-center gap-2">
          <Folder size={14} className="text-gray-500" />
          <input
            ref={newFolderInputRef}
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddFolder();
              if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
            }}
            placeholder="Ordnername..."
            className="bg-gray-800 border border-accent-500 rounded-md px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-accent-500 w-full sm:w-56"
          />
          <button
            className="p-1.5 rounded hover:bg-gray-700 text-green-400"
            onClick={handleAddFolder}
          >
            <Check size={14} />
          </button>
          <button
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
            onClick={() => { setAddingFolder(false); setNewFolderName(''); }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Content */}
      {hasFolders ? (
        <div className="flex flex-col gap-6">
          {/* Folders */}
          {grouped.map(({ folder, entities }) => (
            <FolderSection
              key={folder.id}
              folder={folder}
              entities={entities}
              entityType={entityType}
              entityTypes={entityTypes}
              viewMode={entityViewMode}
              folders={folders}
              onCreateEntity={handleCreateEntity}
              onRenameFolder={(id, name) => updateFolder(id, { name })}
              onDeleteFolder={deleteFolder}
              onMoveEntity={handleMoveEntity}
            />
          ))}

          {/* Ungrouped */}
          {ungrouped.length > 0 && (
            <FolderSection
              folder={null}
              entities={ungrouped}
              entityType={entityType}
              entityTypes={entityTypes}
              viewMode={entityViewMode}
              folders={folders}
              onCreateEntity={handleCreateEntity}
              onMoveEntity={handleMoveEntity}
            />
          )}
        </div>
      ) : (
        
        entityViewMode === 'grid' ? (
          <EntityGridWithFolderMenu
            entities={typeEntities}
            entityTypes={entityTypes}
            folders={[]}
            currentFolderId={null}
            onCreateEntity={handleCreateEntity}
            onMoveEntity={handleMoveEntity}
          />
        ) : (
          <EntityTable
            entities={typeEntities}
            entityTypes={entityTypes}
            onCreateEntity={handleCreateEntity}
          />
        )
      )}
    </div>
  );
}
