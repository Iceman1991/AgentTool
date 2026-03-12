import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '../ui/Badge';
import type { Entity, EntityType } from '../../types';

interface EntityNodeData {
  entity: Entity;
  entityType: EntityType;
  label: string;
}

interface EntityNodeProps {
  data: EntityNodeData;
  selected?: boolean;
}

export const EntityNode = memo(function EntityNode({ data, selected }: EntityNodeProps) {
  const { entity, entityType } = data;

  return (
    <div
      className={`
        bg-gray-800 border rounded-xl p-3 min-w-[160px] max-w-[220px] shadow-lg
        ${selected ? 'border-accent-500 ring-2 ring-accent-500/30' : 'border-gray-600'}
        transition-all duration-150
      `}
      style={{ borderLeftColor: entityType.color, borderLeftWidth: '4px' }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !border-gray-400" />
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-gray-100 text-sm leading-tight truncate">{entity.name}</p>
        <Badge color={entityType.color} size="sm">{entityType.name}</Badge>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-500 !border-gray-400" />
    </div>
  );
});
