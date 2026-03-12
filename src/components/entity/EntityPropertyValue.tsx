import DOMPurify from 'dompurify';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { Badge } from '../ui/Badge';
import { useNavigate } from 'react-router-dom';
import type { PropertyDefinition, PropertyValue } from '../../types';

interface EntityPropertyValueProps {
  property: PropertyDefinition;
  value: PropertyValue;
}

export function EntityPropertyValue({ property, value }: EntityPropertyValueProps) {
  const navigate = useNavigate();
  const getEntity = useEntityStore(s => s.getEntity);
  const getEntityType = useEntityTypeStore(s => s.getEntityType);

  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-600 italic text-sm">—</span>;
  }

  switch (property.type) {
    case 'text':
    case 'number':
      return <span className="text-gray-200 text-sm">{String(value)}</span>;

    case 'date':
      return <span className="text-gray-200 text-sm">{String(value)}</span>;

    case 'boolean':
      return (
        <span className={`text-sm font-medium ${value ? 'text-green-400' : 'text-red-400'}`}>
          {value ? 'Ja' : 'Nein'}
        </span>
      );

    case 'select': {
      const optColor = property.options?.find(o => o.value === String(value))?.color;
      return <Badge color={optColor}>{String(value)}</Badge>;
    }

    case 'multiselect': {
      const vals = Array.isArray(value) ? value : [String(value)];
      return (
        <div className="flex flex-wrap gap-1">
          {vals.map(v => {
            const opt = property.options?.find(o => o.value === v);
            return <Badge key={v} color={opt?.color}>{v}</Badge>;
          })}
        </div>
      );
    }

    case 'richtext': {
      const clean = DOMPurify.sanitize(String(value));
      return (
        <div
          className="prose prose-invert prose-sm max-w-none text-gray-300 pt-1 border-t border-white/[0.06]"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      );
    }

    case 'entity_ref': {
      const entityId = String(value);
      const entity = getEntity(entityId);
      if (!entity) return <span className="text-gray-600 text-sm italic">Unbekannt</span>;
      const et = getEntityType(entity.typeId);
      return (
        <button
          className="inline-flex items-center gap-1.5 text-sm text-accent-400 hover:text-accent-300 underline-offset-2 hover:underline"
          onClick={() => navigate(`/entities/${entityId}`)}
        >
          {et && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: et.color }}
            />
          )}
          {entity.name}
        </button>
      );
    }

    default:
      return <span className="text-gray-200 text-sm">{String(value)}</span>;
  }
}
