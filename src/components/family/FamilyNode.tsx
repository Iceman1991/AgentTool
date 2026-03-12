import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Move, Check, X } from 'lucide-react';
import { useEntityStore } from '../../stores/entityStore';
import type { Entity, EntityType, ImagePosition } from '../../types';

interface FamilyNodeData {
  entity: Entity;
  entityType: EntityType;
  label: string;
}

interface FamilyNodeProps {
  data: FamilyNodeData;
  selected?: boolean;
}

export const FamilyNode = memo(function FamilyNode({ data, selected }: FamilyNodeProps) {
  const { entity, entityType } = data;
  const updateEntity = useEntityStore(s => s.updateEntity);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ImagePosition>(entity.imagePosition ?? { x: 50, y: 50 });
  const [current, setCurrent] = useState<ImagePosition>(entity.imagePosition ?? { x: 50, y: 50 });
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = entity.imagePosition ?? { x: 50, y: 50 };
    setCurrent(p);
    setDraft(p);
  }, [entity.imagePosition?.x, entity.imagePosition?.y]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || !imgRef.current) return;
      const rect = imgRef.current.getBoundingClientRect();
      const dx = (e.clientX - lastMouse.current.x) / rect.width * -100;
      const dy = (e.clientY - lastMouse.current.y) / rect.height * -100;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      setDraft(prev => ({
        x: Math.max(0, Math.min(100, prev.x + dx)),
        y: Math.max(0, Math.min(100, prev.y + dy)),
      }));
    };
    const onUp = () => { dragging.current = false; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isEditing]);

  const confirmEdit = () => {
    setCurrent(draft);
    updateEntity(entity.id, { imagePosition: draft });
    setIsEditing(false);
  };

  const initials = entity.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const activePos = isEditing ? draft : current;

  return (
    <div
      className={`bg-gray-800 border rounded-xl overflow-hidden shadow-lg transition-all duration-150 ${selected ? 'ring-2 ring-accent-500/50' : ''}`}
      style={{ width: 180, minHeight: 220, borderColor: selected ? '#C49A4A' : entityType.color, borderWidth: selected ? 2 : 1 }}
    >
      <div className="h-1.5 w-full flex-shrink-0" style={{ backgroundColor: entityType.color }} />

      <Handle type="target" position={Position.Top} className="!bg-gray-500 !border-gray-400" />

      <div className="flex flex-col items-center gap-3 p-4">
        {entity.imageUrl ? (
          <div
            ref={imgRef}
            className="relative w-20 h-20 rounded-full overflow-hidden border-2 flex-shrink-0 group/img"
            style={{ borderColor: entityType.color }}
            onMouseDown={onMouseDown}
          >
            <img
              src={entity.imageUrl}
              alt={entity.name}
              draggable={false}
              className={`w-full h-full object-cover select-none ${isEditing ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ objectPosition: `${activePos.x}% ${activePos.y}%` }}
            />
            {/* Edit button (hover) */}
            {!isEditing && (
              <button
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/50 opacity-0 group-hover/img:opacity-100 transition-all"
                onClick={e => { e.stopPropagation(); setDraft(current); setIsEditing(true); }}
                title="Bildposition bearbeiten"
              >
                <Move size={16} className="text-white drop-shadow" />
              </button>
            )}
            {/* Confirm/cancel while editing */}
            {isEditing && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-1 pb-0.5">
                <button className="p-0.5 rounded-full bg-green-600 text-white" onClick={e => { e.stopPropagation(); confirmEdit(); }}><Check size={10} /></button>
                <button className="p-0.5 rounded-full bg-gray-700 text-white" onClick={e => { e.stopPropagation(); setCurrent(draft); setIsEditing(false); }}><X size={10} /></button>
              </div>
            )}
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-2 flex-shrink-0"
            style={{ backgroundColor: entityType.color + '28', borderColor: entityType.color }}
          >
            <span className="font-display text-2xl font-bold" style={{ color: entityType.color }}>{initials}</span>
          </div>
        )}

        <p className="font-semibold text-gray-100 text-sm leading-tight text-center">{entity.name}</p>

        <span
          className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ backgroundColor: entityType.color + '28', color: entityType.color }}
        >
          {entityType.name}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-500 !border-gray-400" />
    </div>
  );
});
