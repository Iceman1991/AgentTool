import { useNavigate } from 'react-router-dom';
import { Plus, Network, Clock, Settings, Circle, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useEntityStore } from '../stores/entityStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useUIStore } from '../stores/uiStore';
import { formatGolarionDate } from '../lib/utils';

type LucideIconComponent = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

function EntityTypeIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name];
  return Icon ? <Icon size={size} /> : <Circle size={size} />;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const entities = useEntityStore(s => s.entities);
  const { getSortedEvents } = useTimelineStore();
  const openModal = useUIStore(s => s.openModal);

  const recentEntities = [...entities]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6);

  const recentEvents = getSortedEvents().slice(-5).reverse();

  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  const totalEntities = entities.length;
  const totalRelationships = 0; // Would need to import relationship store
  const totalEvents = getSortedEvents().length;

  return (
    <div className="p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-gray-100 mb-1">Kampagnen-Dashboard</h1>
        <p className="text-gray-500">Überblick deiner Pathfinder 2 Kampagne</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-accent-400 mb-1">{totalEntities}</div>
          <div className="text-sm text-gray-500">Entitäten</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-400 mb-1">{entityTypes.length}</div>
          <div className="text-sm text-gray-500">Typen</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-400 mb-1">{totalEvents}</div>
          <div className="text-sm text-gray-500">Ereignisse</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-400 mb-1">{totalRelationships}</div>
          <div className="text-sm text-gray-500">Beziehungen</div>
        </Card>
      </div>

      {/* Entities by type */}
      <div>
        <h2 className="font-display text-xl font-semibold text-gray-200 mb-4">Entitäten nach Typ</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {entityTypes.map(et => {
            const count = entities.filter(e => e.typeId === et.id).length;
            return (
              <Card
                key={et.id}
                hoverable
                onClick={() => navigate(`/type/${et.slug}`)}
                className="text-center py-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ backgroundColor: et.color + '22', color: et.color }}
                >
                  <EntityTypeIcon name={et.icon} size={24} />
                </div>
                <div className="font-semibold text-gray-200 text-sm">{et.name}</div>
                <div
                  className="text-2xl font-bold mt-1"
                  style={{ color: et.color }}
                >
                  {count}
                </div>
              </Card>
            );
          })}

          <Card
            hoverable
            onClick={() => openModal({ type: 'createEntityType' })}
            className="text-center py-4 border-dashed"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 bg-gray-700">
              <Plus size={24} className="text-gray-500" />
            </div>
            <div className="text-sm text-gray-600">Neuer Typ</div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent entities */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-gray-200">Zuletzt hinzugefügt</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/graph')}>
              <Users size={14} /> Alle anzeigen
            </Button>
          </div>
          <div className="space-y-2">
            {recentEntities.map(entity => {
              const et = typeMap.get(entity.typeId);
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                  onClick={() => navigate(`/entities/${entity.id}`)}
                >
                  {et && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: et.color + '22', color: et.color }}
                    >
                      <EntityTypeIcon name={et.icon} size={14} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-200 text-sm truncate">{entity.name}</p>
                    {et && <p className="text-xs text-gray-500">{et.name}</p>}
                  </div>
                  {entity.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} size="sm">{tag}</Badge>
                  ))}
                </div>
              );
            })}
            {recentEntities.length === 0 && (
              <p className="text-sm text-gray-600 py-4 text-center">Noch keine Entitäten vorhanden</p>
            )}
          </div>
        </div>

        {/* Recent events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-gray-200">Letzte Ereignisse</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/timeline')}>
              <Clock size={14} /> Alle anzeigen
            </Button>
          </div>
          <div className="space-y-2">
            {recentEvents.map(event => (
              <div
                key={event.id}
                className="p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => navigate('/timeline')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 font-mono">{formatGolarionDate(event.date)}</span>
                  {event.sessionNumber && (
                    <Badge size="sm">S{event.sessionNumber}</Badge>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-200">{event.title}</p>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p className="text-sm text-gray-600 py-4 text-center">Noch keine Ereignisse vorhanden</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-gray-200 mb-4">Schnellaktionen</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={() => openModal({ type: 'createEntityType' })}>
            <Plus size={16} /> Neuer Entitäts-Typ
          </Button>
          {entityTypes[0] && (
            <Button variant="secondary" onClick={() => openModal({ type: 'createEntity', payload: { entityTypeId: entityTypes[0].id } })}>
              <Plus size={16} /> Neuer {entityTypes[0].name}
            </Button>
          )}
          <Button variant="secondary" onClick={() => openModal({ type: 'createEvent' })}>
            <Clock size={16} /> Ereignis hinzufügen
          </Button>
          <Button variant="ghost" onClick={() => navigate('/graph')}>
            <Network size={16} /> Graph öffnen
          </Button>
          <Button variant="ghost" onClick={() => navigate('/settings')}>
            <Settings size={16} /> Einstellungen
          </Button>
        </div>
      </div>
    </div>
  );
}
