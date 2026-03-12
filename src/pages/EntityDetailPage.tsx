import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, Plus, ArrowLeft, ExternalLink, LayoutTemplate, Sidebar as SidebarIcon, Maximize2, Copy } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ImagePositionEditor } from '../components/ui/ImagePositionEditor';
import { EntityPropertyValue } from '../components/entity/EntityPropertyValue';
import { NotFoundPage } from './NotFoundPage';
import { useEntityStore } from '../stores/entityStore';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useRelationshipStore } from '../stores/relationshipStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useUIStore } from '../stores/uiStore';
import DOMPurify from 'dompurify';
import { formatGolarionDate, cn } from '../lib/utils';
import type { ImagePosition } from '../types';

function RichDisplay({ html, className }: { html: string; className?: string }) {
  return (
    <span
      className={cn('prose prose-invert prose-sm max-w-none [&_a]:text-accent-400', className)}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

export function EntityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getEntity = useEntityStore(s => s.getEntity);
  const deleteEntity = useEntityStore(s => s.deleteEntity);
  const duplicateEntity = useEntityStore(s => s.duplicateEntity);
  const getEntityType = useEntityTypeStore(s => s.getEntityType);
  const { relationships, relationshipTypes, deleteRelationship, syncDeletedEntity } = useRelationshipStore();
  const entities = useEntityStore(s => s.entities);
  const openModal = useUIStore(s => s.openModal);
  const getEventsByEntity = useTimelineStore(s => s.getEventsByEntity);
  const updateEntity = useEntityStore(s => s.updateEntity);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRelId, setDeletingRelId] = useState<string | null>(null);

  const entity = id ? getEntity(id) : undefined;
  const entityType = entity ? getEntityType(entity.typeId) : undefined;

  const [imageLayout, setImageLayout] = useState<'top' | 'side'>(entity?.imageLayout ?? 'top');
  const [imageSize, setImageSize] = useState<number>(entity?.imageSize ?? 280);

  if (!entity || !entityType) return <NotFoundPage />;

  const entityRelationships = relationships.filter(r => r.sourceId === entity.id || r.targetId === entity.id);
  const linkedEvents = getEventsByEntity(entity.id);
  const sortedProps = [...entityType.properties].sort((a, b) => a.order - b.order);
  const hasProperties = sortedProps.some(p => entity.properties[p.key] !== null && entity.properties[p.key] !== undefined && entity.properties[p.key] !== '');

  const handleSavePosition = (pos: ImagePosition) => {
    updateEntity(entity.id, { imagePosition: pos });
  };

  const handleLayoutChange = (layout: 'top' | 'side') => {
    setImageLayout(layout);
    updateEntity(entity.id, { imageLayout: layout });
  };

  const handleSizeChange = (size: number) => {
    setImageSize(size);
    updateEntity(entity.id, { imageSize: size });
  };

  const handleDelete = async () => {
    await deleteEntity(entity.id);
    syncDeletedEntity(entity.id);
    navigate(-1);
  };

  const handleDeleteRel = async () => {
    if (!deletingRelId) return;
    await deleteRelationship(deletingRelId);
    setDeletingRelId(null);
  };

  // Layout controls bar (shared between modes)
  const layoutControls = entity.imageUrl ? (
    <div className="flex items-center gap-3 px-6 py-2 border-b border-white/[0.05] bg-gray-900/30">
      {/* Layout toggle */}
      <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5 border border-white/[0.07]">
        <button
          type="button"
          onClick={() => handleLayoutChange('top')}
          title="Bild oben (Querformat)"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            imageLayout === 'top' ? 'bg-accent-500/20 text-accent-300' : 'text-gray-500 hover:text-gray-300',
          )}
        >
          <LayoutTemplate size={12} />
          Oben
        </button>
        <button
          type="button"
          onClick={() => handleLayoutChange('side')}
          title="Bild seitlich (Hochformat)"
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
            imageLayout === 'side' ? 'bg-accent-500/20 text-accent-300' : 'text-gray-500 hover:text-gray-300',
          )}
        >
          <SidebarIcon size={12} />
          Seite
        </button>
      </div>

      {/* Size slider */}
      <div className="flex items-center gap-2">
        <Maximize2 size={11} className="text-gray-600 flex-shrink-0" />
        <span className="text-xs text-gray-600 flex-shrink-0">
          {imageLayout === 'top' ? 'Höhe' : 'Breite'}
        </span>
        <input
          type="range"
          min={imageLayout === 'top' ? 120 : 140}
          max={imageLayout === 'top' ? 480 : 420}
          step={20}
          value={imageSize}
          onChange={e => handleSizeChange(Number(e.target.value))}
          className="w-24 h-1 accent-amber-500 cursor-pointer"
        />
        <span className="text-xs text-gray-600 tabular-nums w-10">{imageSize}px</span>
      </div>
    </div>
  ) : null;

  // Action buttons (edit + duplicate + delete)
  const actionButtons = (
    <div className="flex gap-2">
      <Button variant="secondary" size="sm"
        onClick={() => openModal({ type: 'editEntity', payload: { entityId: entity.id } })}>
        <Edit2 size={14} /> Bearbeiten
      </Button>
      <Button variant="ghost" size="sm" title="Duplizieren"
        onClick={async () => {
          const copy = await duplicateEntity(entity.id);
          navigate(`/entities/${copy.id}`);
        }}>
        <Copy size={14} />
      </Button>
      <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
        <Trash2 size={14} />
      </Button>
    </div>
  );

  // Content sections (properties, tags, relationships, events, meta)
  const contentSections = (
    <>
      {hasProperties && (
        <Card>
          <h2 className="font-display text-lg font-semibold text-gray-200 mb-4">Eigenschaften</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-5">
            {sortedProps.map(prop => {
              const value = entity.properties[prop.key];
              if (value === null || value === undefined || value === '') return null;
              const isFullWidth = prop.type === 'richtext' || prop.type === 'multiselect';
              return (
                <div
                  key={prop.id}
                  className="flex flex-col gap-1.5"
                  style={isFullWidth ? { gridColumn: '1 / -1' } : undefined}
                >
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {prop.name}
                  </span>
                  <EntityPropertyValue property={prop} value={value} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {entity.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entity.tags.map(tag => (
            <Badge key={tag}>#{tag}</Badge>
          ))}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-gray-200">
            Beziehungen ({entityRelationships.length})
          </h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openModal({ type: 'addRelationship', payload: { sourceEntityId: entity.id } })}
          >
            <Plus size={14} /> Hinzufügen
          </Button>
        </div>
        {entityRelationships.length === 0 ? (
          <p className="text-sm text-gray-600 italic">Keine Beziehungen vorhanden</p>
        ) : (
          <div className="space-y-2">
            {entityRelationships.map(rel => {
              const isSource = rel.sourceId === entity.id;
              const otherId = isSource ? rel.targetId : rel.sourceId;
              const otherEntity = entities.find(e => e.id === otherId);
              const relType = relationshipTypes.find(rt => rt.id === rel.typeId);
              const otherType = otherEntity ? getEntityType(otherEntity.typeId) : undefined;
              const label = isSource
                ? (rel.label || relType?.label || 'Verbunden')
                : (rel.label || relType?.inverseLabel || relType?.label || 'Verbunden');
              return (
                <div
                  key={rel.id}
                  className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg border border-white/[0.07] hover:border-white/[0.14] hover:bg-gray-700/50"
                >
                  <div className="flex-shrink-0 w-1.5 h-8 rounded-full" style={{ backgroundColor: relType?.color || '#6B7280' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (relType?.color || '#6B7280') + '22', color: relType?.color || '#9CA3AF' }}>
                        {label}
                      </span>
                      {otherEntity && (
                        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-200 hover:text-accent-400 transition-colors" onClick={() => navigate(`/entities/${otherId}`)}>
                          {otherType && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: otherType.color }} />}
                          {otherEntity.name}
                          <ExternalLink size={12} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                    {rel.notes && <RichDisplay html={rel.notes} className="text-xs text-gray-500 mt-0.5" />}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setDeletingRelId(rel.id)} className="flex-shrink-0">
                    <Trash2 size={12} className="text-red-400" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {linkedEvents.length > 0 && (
        <Card>
          <h2 className="font-display text-lg font-semibold text-gray-200 mb-4">
            Verknüpfte Ereignisse ({linkedEvents.length})
          </h2>
          <div className="space-y-2">
            {linkedEvents.map(event => (
              <div key={event.id} className="p-3 bg-gray-700/30 rounded-lg border border-white/[0.07] cursor-pointer hover:border-white/[0.14] hover:bg-gray-700/50" onClick={() => navigate('/timeline')}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-gray-500 font-mono">{formatGolarionDate(event.date)}</span>
                </div>
                <p className="text-sm font-medium text-gray-200">{event.title}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-600 space-y-0.5">
        <p>Erstellt: {new Date(entity.createdAt).toLocaleString('de-DE')}</p>
        <p>Aktualisiert: {new Date(entity.updatedAt).toLocaleString('de-DE')}</p>
      </div>
    </>
  );

  return (
    <div className="w-full">
      {/* TOP LAYOUT */}
      {imageLayout === 'top' && (
        <>
          {entity.imageUrl ? (
            <ImagePositionEditor
              src={entity.imageUrl}
              alt={entity.name}
              position={entity.imagePosition}
              onSave={handleSavePosition}
              className="w-full"
              style={{ height: `${imageSize}px` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between pointer-events-auto">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="bg-black/40 border border-white/10">
                    <ArrowLeft size={14} />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl font-bold text-white drop-shadow">{entity.name}</h1>
                      <Badge color={entityType.color}>{entityType.name}</Badge>
                    </div>
                    {entity.summary && <RichDisplay html={entity.summary} className="text-sm text-gray-300 mt-0.5 drop-shadow" />}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="bg-black/40 border-white/10"
                    onClick={() => openModal({ type: 'editEntity', payload: { entityId: entity.id } })}>
                    <Edit2 size={14} /> Bearbeiten
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </ImagePositionEditor>
          ) : (
            <div style={{ borderTop: `3px solid ${entityType.color}` }}>
              <div className="flex items-center gap-3 p-6 pb-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft size={14} />
                </Button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-gray-100">{entity.name}</h1>
                    <Badge color={entityType.color}>{entityType.name}</Badge>
                  </div>
                  {entity.summary && <RichDisplay html={entity.summary} className="text-sm text-gray-400 mt-0.5" />}
                </div>
                {actionButtons}
              </div>
            </div>
          )}
          {layoutControls}
          <div className="p-6 space-y-5">{contentSections}</div>
        </>
      )}

      {/* SIDE LAYOUT */}
      {imageLayout === 'side' && (
        <>
          {/* Header bar */}
          <div style={{ borderTop: `3px solid ${entityType.color}` }}>
            <div className="flex items-center gap-3 px-6 pt-4 pb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft size={14} />
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-2xl font-bold text-gray-100 truncate">{entity.name}</h1>
                  <Badge color={entityType.color}>{entityType.name}</Badge>
                </div>
                {entity.summary && <p className="text-sm text-gray-400 mt-0.5">{entity.summary}</p>}
              </div>
              {actionButtons}
            </div>
          </div>
          {layoutControls}

          {/* Two-column content */}
          <div className="flex gap-0 items-start">
            {/* Left: content */}
            <div className="flex-1 min-w-0 p-6 space-y-5">
              {contentSections}
            </div>

            {/* Right: portrait image */}
            {entity.imageUrl && (
              <div
                className="flex-shrink-0 p-4 pt-6"
                style={{ width: `${imageSize + 32}px` }}
              >
                <ImagePositionEditor
                  src={entity.imageUrl}
                  alt={entity.name}
                  position={entity.imagePosition}
                  onSave={handleSavePosition}
                  className="rounded-xl border border-white/[0.08] overflow-hidden"
                  style={{ width: `${imageSize}px`, height: `${Math.round(imageSize * 1.45)}px` }}
                />
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Eintrag löschen"
        message={`Möchtest du "${entity.name}" wirklich löschen? Der Eintrag wird in den Papierkorb verschoben.`}
      />
      <ConfirmDialog
        isOpen={!!deletingRelId}
        onClose={() => setDeletingRelId(null)}
        onConfirm={handleDeleteRel}
        title="Beziehung löschen"
        message="Möchtest du diese Beziehung wirklich löschen?"
      />
    </div>
  );
}
