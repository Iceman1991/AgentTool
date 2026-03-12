import DOMPurify from 'dompurify';
import type { LucideProps } from 'lucide-react';
import { Sword, Users, Compass, Coffee, Eye, Skull, Star, Circle, Lock, Edit2, Trash2 } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { formatGolarionDate } from '../../lib/utils';
import type { TimelineEvent as TEvent, EventCategory } from '../../types';
import { useNavigate } from 'react-router-dom';

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

const categoryConfig: Record<EventCategory, { label: string; color: string; Icon: LucideIcon }> = {
  combat: { label: 'Kampf', color: '#DC2626', Icon: Sword },
  social: { label: 'Sozial', color: '#0891B2', Icon: Users },
  exploration: { label: 'Erkundung', color: '#059669', Icon: Compass },
  downtime: { label: 'Freizeit', color: '#D97706', Icon: Coffee },
  revelation: { label: 'Enthüllung', color: '#7C3AED', Icon: Eye },
  death: { label: 'Tod', color: '#1F2937', Icon: Skull },
  milestone: { label: 'Meilenstein', color: '#DB2777', Icon: Star },
  custom: { label: 'Sonstiges', color: '#6B7280', Icon: Circle },
};

interface TimelineEventProps {
  event: TEvent;
  onEdit?: (event: TEvent) => void;
  onDelete?: (event: TEvent) => void;
}

export function TimelineEventCard({ event, onEdit, onDelete }: TimelineEventProps) {
  const navigate = useNavigate();
  const getEntity = useEntityStore(s => s.getEntity);
  const getEntityType = useEntityTypeStore(s => s.getEntityType);

  const cfg = categoryConfig[event.category];
  const Icon = cfg.Icon;

  const cleanDescription = event.description ? DOMPurify.sanitize(event.description) : null;

  return (
    <div className="flex gap-4">
      {/* Timeline indicator */}
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2"
          style={{ backgroundColor: cfg.color + '22', borderColor: cfg.color }}
        >
          <Icon size={16} color={cfg.color} />
        </div>
        <div className="w-px flex-1 bg-gray-700 mt-2" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gray-600 transition-colors">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-mono">
                  {formatGolarionDate(event.date)}
                </span>
                <Badge color={cfg.color}>{cfg.label}</Badge>
                {event.sessionNumber && (
                  <Badge>Sitzung {event.sessionNumber}</Badge>
                )}
                {event.isSecret && (
                  <Badge color="#6B7280">
                    <Lock size={10} className="mr-0.5" /> Geheim
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-semibold text-gray-100 mt-1">{event.title}</h3>
            </div>
            {(onEdit || onDelete) && (
              <div className="flex gap-1 flex-shrink-0">
                {onEdit && (
                  <Button variant="ghost" size="sm" onClick={() => onEdit(event)}>
                    <Edit2 size={12} />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="sm" onClick={() => onDelete(event)}>
                    <Trash2 size={12} className="text-red-400" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {cleanDescription && (
            <div
              className="prose prose-invert prose-sm max-w-none text-gray-400 mb-3"
              dangerouslySetInnerHTML={{ __html: cleanDescription }}
            />
          )}

          {event.linkedEntityIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-700">
              {event.linkedEntityIds.map(id => {
                const entity = getEntity(id);
                if (!entity) return null;
                const et = getEntityType(entity.typeId);
                return (
                  <button
                    key={id}
                    onClick={() => navigate(`/entities/${id}`)}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: (et?.color || '#6B7280') + '22',
                      color: et?.color || '#9CA3AF',
                      border: `1px solid ${(et?.color || '#6B7280')}44`,
                    }}
                  >
                    {et && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: et.color }} />}
                    {entity.name}
                  </button>
                );
              })}
            </div>
          )}

          {event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {event.tags.map(tag => (
                <span key={tag} className="text-xs text-gray-600 bg-gray-900 px-1.5 py-0.5 rounded">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
