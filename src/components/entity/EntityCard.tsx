import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ImagePositionEditor } from '../ui/ImagePositionEditor';
import { useEntityStore } from '../../stores/entityStore';
import type { Entity, EntityType, ImagePosition } from '../../types';
import { stripHtml } from '../../lib/utils';

interface EntityCardProps {
  entity: Entity;
  entityType: EntityType;
}

export function EntityCard({ entity, entityType }: EntityCardProps) {
  const navigate = useNavigate();
  const updateEntity = useEntityStore(s => s.updateEntity);

  const summaryText = entity.summary ? stripHtml(entity.summary).slice(0, 100) : null;

  const handleSavePosition = (pos: ImagePosition) => {
    updateEntity(entity.id, { imagePosition: pos });
  };

  return (
    <Card
      className="flex flex-col gap-0 p-0 overflow-hidden h-full cursor-pointer"
      onClick={() => navigate(`/entities/${entity.id}`)}
      hoverable
    >
      {/* Image or color strip */}
      {entity.imageUrl ? (
        <div
          className="h-52 flex-shrink-0"
          onClick={e => e.stopPropagation()} // prevent card navigation when repositioning
        >
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
        <div
          className="h-1.5 flex-shrink-0"
          style={{ backgroundColor: entityType.color }}
        />
      )}

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-100 leading-snug">{entity.name}</h3>
          <Badge color={entityType.color} size="sm" className="flex-shrink-0">
            {entityType.name}
          </Badge>
        </div>

        {summaryText && (
          <p className="text-[13px] text-gray-400 line-clamp-2 leading-relaxed">{summaryText}</p>
        )}

        {entity.tags.length > 0 && (
          <div className="mt-auto pt-2 flex flex-wrap gap-1.5">
            {entity.tags.slice(0, 3).map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Tag size={9} /> {tag}
              </span>
            ))}
            {entity.tags.length > 3 && (
              <span className="text-xs text-gray-600">+{entity.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
