import { EntityCard } from './EntityCard';
import { EmptyState } from '../ui/EmptyState';
import { Users } from 'lucide-react';
import type { Entity, EntityType } from '../../types';

interface EntityGridProps {
  entities: Entity[];
  entityTypes: EntityType[];
  onCreateEntity?: () => void;
}

export function EntityGrid({ entities, entityTypes, onCreateEntity }: EntityGridProps) {
  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  if (entities.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="Keine Einträge vorhanden"
        description="Erstelle deinen ersten Eintrag für diesen Typ."
        actionLabel={onCreateEntity ? 'Neuer Eintrag' : undefined}
        onAction={onCreateEntity}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {entities.map(entity => {
        const entityType = typeMap.get(entity.typeId);
        if (!entityType) return null;
        return <EntityCard key={entity.id} entity={entity} entityType={entityType} />;
      })}
    </div>
  );
}
