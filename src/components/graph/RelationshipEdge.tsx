import { memo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getStraightPath, type EdgeProps } from '@xyflow/react';
import type { Relationship, RelationshipType } from '../../types';

interface RelationshipEdgeData {
  relationship: Relationship;
  relationshipType: RelationshipType | undefined;
  label: string;
}

export const RelationshipEdge = memo(function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  markerEnd,
}: EdgeProps & { data?: RelationshipEdgeData }) {
  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  const color = data?.relationshipType?.color || '#6B7280';
  const label = data?.label || '';
  const isDirected = data?.relationshipType?.direction === 'directed';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={isDirected ? markerEnd : undefined}
        style={{ stroke: color, strokeWidth: 2, opacity: 0.8 }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="absolute pointer-events-none"
          >
            <span
              className="px-1.5 py-0.5 rounded text-xs font-medium border"
              style={{
                backgroundColor: color + '22',
                color,
                borderColor: color + '55',
              }}
            >
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
