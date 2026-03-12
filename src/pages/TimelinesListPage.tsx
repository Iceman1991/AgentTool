import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock } from 'lucide-react';
import { useTimelineMetaStore } from '../stores/timelineMetaStore';
import { useTimelineStore } from '../stores/timelineStore';
import { cn } from '../lib/utils';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function TimelinesListPage() {
  const navigate = useNavigate();
  const { timelines, createTimeline, load } = useTimelineMetaStore();
  const allEvents = useTimelineStore(s => s.events);

  useEffect(() => { load(); }, [load]);

  const sorted = [...timelines].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreate = async () => {
    const timeline = await createTimeline();
    navigate(`/timeline/${timeline.id}`);
  };

  const getEventCount = (timeline: (typeof timelines)[number]) => {
    const { filterEntityIds, filterTags } = timeline;
    if (filterEntityIds.length === 0 && filterTags.length === 0) return allEvents.length;
    return allEvents.filter(e => {
      const entityMatch = filterEntityIds.length === 0
        || e.linkedEntityIds.some(id => filterEntityIds.includes(id));
      const tagMatch = filterTags.length === 0
        || e.tags.some(t => filterTags.includes(t));
      return entityMatch && tagMatch;
    }).length;
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100">Zeitleisten</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {timelines.length === 0
              ? 'Noch keine Zeitleisten'
              : `${timelines.length} Zeitleiste${timelines.length !== 1 ? 'n' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Neue Zeitleiste
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <Clock size={32} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-1">Noch keine Zeitleisten</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Erstelle eine Zeitleiste, um Kampagnenereignisse gefiltert und übersichtlich darzustellen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Erste Zeitleiste erstellen
          </button>
        </div>
      )}

      {/* Grid */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(timeline => {
            const count = getEventCount(timeline);
            return (
              <button
                key={timeline.id}
                type="button"
                onClick={() => navigate(`/timeline/${timeline.id}`)}
                className={cn(
                  'group flex flex-col gap-3 p-4 bg-gray-800 rounded-xl border border-white/[0.06]',
                  'hover:border-white/[0.12] hover:bg-gray-800/80 transition-all text-left',
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: timeline.color + '22' }}
                  >
                    <Clock size={20} style={{ color: timeline.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 truncate group-hover:text-accent-400 transition-colors">
                      {timeline.name}
                    </h3>
                    {timeline.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{timeline.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{count} Ereignis{count !== 1 ? 'se' : ''}</span>
                  {(timeline.filterEntityIds.length > 0 || timeline.filterTags.length > 0) && (
                    <span className="text-gray-600">Gefiltert</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="h-1 flex-1 rounded-full"
                    style={{ backgroundColor: timeline.color + '44' }}
                  >
                    <div className="h-1 rounded-full w-full" style={{ backgroundColor: timeline.color }} />
                  </div>
                </div>

                <div className="text-xs text-gray-600 mt-auto">
                  Geändert: {formatDate(timeline.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
