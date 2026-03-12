import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Filter, SortAsc, SortDesc, Trash2, ChevronLeft, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { ColorPicker } from '../components/ui/ColorPicker';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TimelineEventCard } from '../components/timeline/TimelineEvent';
import { useTimelineStore } from '../stores/timelineStore';
import { useTimelineMetaStore } from '../stores/timelineMetaStore';
import { useEntityStore } from '../stores/entityStore';
import { useUIStore } from '../stores/uiStore';
import { NotFoundPage } from './NotFoundPage';
import type { EventCategory } from '../types';
import { Clock } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Alle Kategorien' },
  { value: 'combat', label: 'Kampf' },
  { value: 'social', label: 'Sozial' },
  { value: 'exploration', label: 'Erkundung' },
  { value: 'downtime', label: 'Freizeit' },
  { value: 'revelation', label: 'Enthüllung' },
  { value: 'death', label: 'Tod' },
  { value: 'milestone', label: 'Meilenstein' },
  { value: 'custom', label: 'Sonstiges' },
];

type TEvent = ReturnType<typeof useTimelineStore.getState>['events'][number];

export function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getSortedEvents, deleteEvent } = useTimelineStore();
  const { timelines, updateTimeline, deleteTimeline } = useTimelineMetaStore();
  const entities = useEntityStore(s => s.entities);
  const openModal = useUIStore(s => s.openModal);

  const timeline = timelines.find(t => t.id === id);

  const [nameValue, setNameValue] = useState(timeline?.name ?? '');
  const [descValue, setDescValue] = useState(timeline?.description ?? '');
  const [colorValue, setColorValue] = useState(timeline?.color ?? '#7C3AED');
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showSecrets, setShowSecrets] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TEvent | null>(null);
  const [newEntityFilterId, setNewEntityFilterId] = useState('');
  const [newTagFilter, setNewTagFilter] = useState('');

  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeline) {
      setNameValue(timeline.name);
      setDescValue(timeline.description ?? '');
      setColorValue(timeline.color);
    }
  }, [timeline?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!timeline) return;
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    nameDebounce.current = setTimeout(() => {
      if (nameValue !== timeline.name) updateTimeline(timeline.id, { name: nameValue });
    }, 500);
    return () => { if (nameDebounce.current) clearTimeout(nameDebounce.current); };
  }, [nameValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!timeline) return;
    if (descDebounce.current) clearTimeout(descDebounce.current);
    descDebounce.current = setTimeout(() => {
      if (descValue !== (timeline.description ?? '')) updateTimeline(timeline.id, { description: descValue });
    }, 500);
    return () => { if (descDebounce.current) clearTimeout(descDebounce.current); };
  }, [descValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!timeline) return;
    if (colorValue !== timeline.color) updateTimeline(timeline.id, { color: colorValue });
  }, [colorValue]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!timeline) return;
    await deleteTimeline(timeline.id);
    navigate('/timeline');
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    await deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  };

  const removeEntityFilter = (entityId: string) => {
    if (!timeline) return;
    updateTimeline(timeline.id, {
      filterEntityIds: timeline.filterEntityIds.filter(id => id !== entityId),
    });
  };

  const addEntityFilter = () => {
    if (!timeline || !newEntityFilterId) return;
    if (timeline.filterEntityIds.includes(newEntityFilterId)) return;
    updateTimeline(timeline.id, {
      filterEntityIds: [...timeline.filterEntityIds, newEntityFilterId],
    });
    setNewEntityFilterId('');
  };

  const removeTagFilter = (tag: string) => {
    if (!timeline) return;
    updateTimeline(timeline.id, {
      filterTags: timeline.filterTags.filter(t => t !== tag),
    });
  };

  const addTagFilter = () => {
    if (!timeline || !newTagFilter.trim()) return;
    const tag = newTagFilter.trim();
    if (timeline.filterTags.includes(tag)) return;
    updateTimeline(timeline.id, {
      filterTags: [...timeline.filterTags, tag],
    });
    setNewTagFilter('');
  };

  if (!timeline) return <NotFoundPage />;

  const sorted = getSortedEvents();

  // Apply timeline filters
  const timelineFiltered = sorted.filter(e => {
    const entityMatch = timeline.filterEntityIds.length === 0
      || e.linkedEntityIds.some(eid => timeline.filterEntityIds.includes(eid));
    const tagMatch = timeline.filterTags.length === 0
      || e.tags.some(t => timeline.filterTags.includes(t));
    return entityMatch && tagMatch;
  });

  const filtered = timelineFiltered
    .filter(e => !categoryFilter || e.category === categoryFilter)
    .filter(e => showSecrets || !e.isSecret);

  const displayed = sortDir === 'asc' ? filtered : [...filtered].reverse();

  const entityOptions = [
    { value: '', label: 'Entität wählen...' },
    ...entities.map(e => ({ value: e.id, label: e.name })),
  ];

  return (
    <div className="h-full flex flex-col gap-0">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] flex-shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/timeline')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ChevronLeft size={14} />
          Alle Zeitleisten
        </button>
        <span className="text-gray-700">/</span>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: colorValue }}
        />
        <input
          type="text"
          value={nameValue}
          onChange={e => setNameValue(e.target.value)}
          className="font-display text-lg font-semibold text-gray-100 bg-transparent outline-none border-none min-w-0 flex-1"
          placeholder="Zeitleisten-Name..."
        />
        <input
          type="text"
          value={descValue}
          onChange={e => setDescValue(e.target.value)}
          className="text-sm text-gray-500 bg-transparent outline-none border-none min-w-0 w-48 hidden sm:block"
          placeholder="Beschreibung..."
        />
        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition-colors"
        >
          <Filter size={14} />
          Filter
        </button>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={14} />
          Löschen
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 py-3 border-b border-white/[0.06] bg-gray-800/40 flex flex-col gap-4 flex-shrink-0">
          {/* Color */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Farbe</p>
            <ColorPicker value={colorValue} onChange={setColorValue} />
          </div>

          {/* Entity filters */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Entitäten-Filter (leer = alle)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {timeline.filterEntityIds.map(eid => {
                const entity = entities.find(e => e.id === eid);
                return (
                  <span key={eid} className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs">
                    {entity?.name ?? eid}
                    <button type="button" onClick={() => removeEntityFilter(eid)} className="hover:text-red-400">
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
            <div className="flex gap-2">
              <select
                value={newEntityFilterId}
                onChange={e => setNewEntityFilterId(e.target.value)}
                className="flex-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-2 py-1"
              >
                {entityOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button
                type="button"
                onClick={addEntityFilter}
                disabled={!newEntityFilterId}
                className="px-3 py-1 bg-accent-500 text-white rounded-lg text-xs disabled:opacity-50"
              >
                Hinzufügen
              </button>
            </div>
          </div>

          {/* Tag filters */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tag-Filter (leer = alle)
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {timeline.filterTags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded-lg text-xs">
                  {tag}
                  <button type="button" onClick={() => removeTagFilter(tag)} className="hover:text-red-400">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagFilter}
                onChange={e => setNewTagFilter(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTagFilter()}
                placeholder="Tag eingeben..."
                className="flex-1 text-sm bg-gray-700 text-gray-300 border border-gray-600 rounded-lg px-2 py-1 outline-none"
              />
              <button
                type="button"
                onClick={addTagFilter}
                disabled={!newTagFilter.trim()}
                className="px-3 py-1 bg-accent-500 text-white rounded-lg text-xs disabled:opacity-50"
              >
                Hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col gap-4 p-6 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="font-display text-2xl font-semibold text-gray-100" style={{ color: colorValue }}>
            {nameValue || 'Zeitleiste'}
          </h1>
          <Button
            variant="primary"
            onClick={() => openModal({ type: 'createEvent' })}
          >
            <Plus size={16} /> Ereignis hinzufügen
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-gray-400">
            <Filter size={14} />
            <span className="text-sm">Filter:</span>
          </div>
          <Select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as EventCategory | '')}
            options={CATEGORY_OPTIONS}
            className="w-48"
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-400">
            <input
              type="checkbox"
              checked={showSecrets}
              onChange={e => setShowSecrets(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500"
            />
            Geheime zeigen
          </label>
          <button
            onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            {sortDir === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />}
            {sortDir === 'asc' ? 'Älteste zuerst' : 'Neueste zuerst'}
          </button>
          <span className="text-sm text-gray-600">{displayed.length} Ereignisse</span>
        </div>

        {displayed.length === 0 ? (
          <EmptyState
            icon={<Clock size={32} />}
            title="Keine Ereignisse vorhanden"
            description="Füge dein erstes Kampagnen-Ereignis hinzu."
            actionLabel="Ereignis hinzufügen"
            onAction={() => openModal({ type: 'createEvent' })}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl">
              {displayed.map(event => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  onEdit={e => openModal({ type: 'editEvent', payload: { eventId: e.id } })}
                  onDelete={e => setDeleteTarget(e)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteEvent}
        title="Ereignis löschen"
        message={`Möchtest du "${deleteTarget?.title}" wirklich löschen?`}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Zeitleiste löschen"
        message={`Möchtest du die Zeitleiste "${timeline.name}" wirklich löschen?`}
      />
    </div>
  );
}
