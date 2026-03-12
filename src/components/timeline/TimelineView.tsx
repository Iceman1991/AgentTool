import { useState } from 'react';
import { Plus, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EmptyState } from '../ui/EmptyState';
import { TimelineEventCard } from './TimelineEvent';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { TimelineEvent, EventCategory } from '../../types';
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

export function TimelineView() {
  const { getSortedEvents, deleteEvent } = useTimelineStore();
  const openModal = useUIStore(s => s.openModal);

  const [categoryFilter, setCategoryFilter] = useState<EventCategory | ''>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showSecrets, setShowSecrets] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TEvent | null>(null);

  type TEvent = TimelineEvent;

  const sorted = getSortedEvents();
  const filtered = sorted
    .filter(e => !categoryFilter || e.category === categoryFilter)
    .filter(e => showSecrets || !e.isSecret);

  const displayed = sortDir === 'asc' ? filtered : [...filtered].reverse();

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteEvent(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display text-2xl font-semibold text-gray-100">Zeitleiste</h1>
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

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Ereignis löschen"
        message={`Möchtest du "${deleteTarget?.title}" wirklich löschen?`}
      />
    </div>
  );
}
