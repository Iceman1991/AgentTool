import { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Filter, SortAsc, SortDesc, Trash2, ChevronLeft, X, Pencil, Clock } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { EmptyState } from '../components/ui/EmptyState';
import { ColorPicker } from '../components/ui/ColorPicker';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useTimelineStore } from '../stores/timelineStore';
import { useTimelineMetaStore } from '../stores/timelineMetaStore';
import { useEntityStore } from '../stores/entityStore';
import { useUIStore } from '../stores/uiStore';
import { NotFoundPage } from './NotFoundPage';
import type { EventCategory, GolarionDate } from '../types';
import { MONTH_ORDER, formatGolarionDate, stripHtml } from '../lib/utils';

// ── Visual timeline ──────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  combat: '#DC2626', social: '#0891B2', exploration: '#059669',
  downtime: '#D97706', revelation: '#7C3AED', death: '#4B5563',
  milestone: '#DB2777', custom: '#6B7280',
};
const CAT_LABELS: Record<string, string> = {
  combat: 'Kampf', social: 'Sozial', exploration: 'Erkundung',
  downtime: 'Freizeit', revelation: 'Enthüllung', death: 'Tod',
  milestone: 'Meilenstein', custom: 'Sonstiges',
};

function dateToNum(d: GolarionDate): number {
  return d.year * 360 + (MONTH_ORDER[d.month as keyof typeof MONTH_ORDER] ?? 0) * 30 + d.day;
}

const PX_YEAR = 160;
const VT_ABOVE = 150;
const VT_BELOW = 150;
const VT_STEM = 44;
const VT_CARD_W = 152;
const VT_CARD_H = 60;
const VT_PAD = 60;

interface VTProps {
  events: TEvent[];
  color: string;
  onEdit: (e: TEvent) => void;
  onDelete: (e: TEvent) => void;
}

function HorizontalTimeline({ events, color, onEdit, onDelete }: VTProps) {
  const allEntities = useEntityStore(s => s.entities);
  const [activeId, setActiveId] = useState<string | null>(null);

  const minYear = events.reduce((m, e) => Math.min(m, e.date.year), Infinity);
  const maxYear = events.reduce((m, e) => Math.max(m, e.date.year), -Infinity);
  const yearSpan = Math.max(maxYear - minYear + 1, 1);
  const displayMin = minYear * 360;
  const displayRange = yearSpan * 360;
  const innerW = Math.max(500, yearSpan * PX_YEAR);
  const totalW = innerW + VT_PAD * 2;
  const axisY = VT_ABOVE;
  const totalH = VT_ABOVE + VT_BELOW + 28;

  const getX = (num: number) => VT_PAD + ((num - displayMin) / displayRange) * innerW;

  const yearTicks = Array.from({ length: yearSpan + 1 }, (_, i) => ({
    year: minYear + i,
    x: getX((minYear + i) * 360),
  }));

  const activeEvent = events.find(e => e.id === activeId) ?? null;
  const activeCatColor = activeEvent ? (CAT_COLORS[activeEvent.category] ?? color) : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Scrollable visual */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <div style={{ position: 'relative', width: totalW, height: totalH }}>

          {/* Axis line */}
          <div style={{
            position: 'absolute', top: axisY, left: VT_PAD - 12,
            width: innerW + 24, height: 2,
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12) 4%, rgba(255,255,255,0.12) 96%, transparent)',
          }} />
          {/* Arrow head */}
          <div style={{
            position: 'absolute', top: axisY - 5, left: VT_PAD + innerW + 13,
            width: 0, height: 0,
            borderTop: '5px solid transparent', borderBottom: '5px solid transparent',
            borderLeft: '8px solid rgba(255,255,255,0.18)',
          }} />

          {/* Year ticks + labels */}
          {yearTicks.map(({ year, x }) => (
            <Fragment key={year}>
              <div style={{
                position: 'absolute', left: x, top: axisY - 5,
                width: 1, height: 10, background: 'rgba(255,255,255,0.14)',
                transform: 'translateX(-50%)',
              }} />
              <div style={{
                position: 'absolute', left: x, top: axisY + VT_BELOW + 4,
                transform: 'translateX(-50%)', fontSize: 11, color: '#504840',
                whiteSpace: 'nowrap',
              }}>
                {year} SR
              </div>
            </Fragment>
          ))}

          {/* Events */}
          {events.map((event, i) => {
            const x = getX(dateToNum(event.date));
            const above = i % 2 === 0;
            const catColor = CAT_COLORS[event.category] ?? '#6B7280';
            const isActive = activeId === event.id;
            const cardLeft = Math.max(2, Math.min(x - VT_CARD_W / 2, totalW - VT_CARD_W - 2));
            const cardTop = above ? axisY - VT_STEM - VT_CARD_H : axisY + VT_STEM;
            const stemTop = above ? axisY - VT_STEM : axisY;

            return (
              <Fragment key={event.id}>
                {/* Stem */}
                <div style={{
                  position: 'absolute', left: x, top: stemTop,
                  width: 2, height: VT_STEM,
                  background: isActive ? catColor : `${catColor}55`,
                  transform: 'translateX(-50%)',
                  transition: 'background 0.15s',
                }} />

                {/* Dot */}
                <button
                  type="button"
                  onClick={() => setActiveId(isActive ? null : event.id)}
                  style={{
                    position: 'absolute', left: x, top: axisY,
                    transform: 'translate(-50%, -50%)',
                    width: 14, height: 14, borderRadius: '50%',
                    background: catColor,
                    border: `2px solid ${isActive ? '#EDE8DC' : `${catColor}99`}`,
                    boxShadow: isActive ? `0 0 10px ${catColor}` : `0 0 4px ${catColor}66`,
                    cursor: 'pointer', padding: 0, zIndex: isActive ? 15 : 10,
                    outline: 'none', transition: 'box-shadow 0.15s',
                  }}
                />

                {/* Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveId(isActive ? null : event.id)}
                  onKeyDown={e => e.key === 'Enter' && setActiveId(isActive ? null : event.id)}
                  style={{
                    position: 'absolute', left: cardLeft, top: cardTop,
                    width: VT_CARD_W, height: VT_CARD_H,
                    background: isActive ? '#252530' : '#19191f',
                    border: `1px solid ${isActive ? catColor : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '7px 10px',
                    cursor: 'pointer', zIndex: isActive ? 14 : 5,
                    overflow: 'hidden',
                    transition: 'background 0.15s, border-color 0.15s',
                    outline: 'none',
                  }}
                >
                  <div style={{ fontSize: 10, color: catColor, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: catColor, flexShrink: 0, display: 'inline-block' }} />
                    {formatGolarionDate(event.date)}
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#EDE8DC',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4,
                  }}>
                    {event.title}
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {activeEvent && (
        <div style={{
          borderRadius: 10,
          border: `1px solid ${activeCatColor}44`,
          borderLeft: `3px solid ${activeCatColor}`,
          background: '#17171d',
          padding: '14px 16px',
          display: 'flex', flexDirection: 'column', gap: 6,
          marginTop: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: activeCatColor, marginBottom: 4, display: 'flex', flexWrap: 'wrap', gap: '3px 10px' }}>
                <span>{formatGolarionDate(activeEvent.date)}</span>
                <span style={{ color: '#40382E' }}>·</span>
                <span>{CAT_LABELS[activeEvent.category]}</span>
                {activeEvent.sessionNumber != null && (
                  <Fragment><span style={{ color: '#40382E' }}>·</span><span>Sitzung {activeEvent.sessionNumber}</span></Fragment>
                )}
                {activeEvent.isSecret && (
                  <Fragment><span style={{ color: '#40382E' }}>·</span><span>🔒 Geheim</span></Fragment>
                )}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#EDE8DC', marginBottom: 4 }}>
                {activeEvent.title}
              </div>
              {activeEvent.description && (
                <div style={{ fontSize: 13, color: '#7A7060', lineHeight: 1.5 }}>
                  {(() => { const t = stripHtml(activeEvent.description); return t.length > 220 ? t.slice(0, 220) + '…' : t; })()}
                </div>
              )}
              {activeEvent.linkedEntityIds.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {activeEvent.linkedEntityIds.map(eid => {
                    const entity = allEntities.find(e => e.id === eid);
                    return entity ? (
                      <span key={eid} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: '#7A7060', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {entity.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              {activeEvent.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {activeEvent.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, color: '#4A4438' }}>#{t}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => onEdit(activeEvent)}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 7, padding: '5px 8px', color: '#7A7060', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => { onDelete(activeEvent); setActiveId(null); }}
                style={{ background: 'rgba(220,38,38,0.08)', border: 'none', borderRadius: 7, padding: '5px 8px', color: '#DC2626', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <Trash2 size={13} />
              </button>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                style={{ background: 'none', border: 'none', borderRadius: 7, padding: '5px 6px', color: '#4A4438', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const { timelines, updateTimeline, deleteTimeline, load } = useTimelineMetaStore();
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

  useEffect(() => { load(); }, [load]);

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
          <HorizontalTimeline
            events={displayed}
            color={colorValue}
            onEdit={e => openModal({ type: 'editEvent', payload: { eventId: e.id } })}
            onDelete={e => setDeleteTarget(e)}
          />
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
