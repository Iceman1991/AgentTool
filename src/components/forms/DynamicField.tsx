import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { RichTextEditor } from '../ui/RichTextEditor';

import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import type { PropertyDefinition, PropertyValue } from '../../types';
import { cn } from '../../lib/utils';

interface DynamicFieldProps {
  property: PropertyDefinition;
  value: PropertyValue;
  onChange: (value: PropertyValue) => void;
}

export function DynamicField({ property, value, onChange }: DynamicFieldProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const entities = useEntityStore(s => s.entities);
  const getEntityType = useEntityTypeStore(s => s.getEntityType);

  const label = property.name + (property.required ? ' *' : '');

  switch (property.type) {
    case 'text':
      return (
        <Input
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          placeholder={property.placeholder}
        />
      );

    case 'number':
      return (
        <Input
          label={label}
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
          placeholder={property.placeholder}
        />
      );

    case 'date':
      return (
        <Input
          label={label}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'boolean':
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={e => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500 focus:ring-accent-500"
            />
            <span className="text-sm text-gray-400">{Boolean(value) ? 'Ja' : 'Nein'}</span>
          </label>
        </div>
      );

    case 'select':
      return (
        <Select
          label={label}
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          options={(property.options || []).map(o => ({ value: o.value, label: o.label }))}
          placeholder="Auswählen..."
        />
      );

    case 'multiselect': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <div className="flex flex-wrap gap-2">
            {(property.options || []).map(opt => {
              const checked = selected.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      if (e.target.checked) {
                        onChange([...selected, opt.value]);
                      } else {
                        onChange(selected.filter(v => v !== opt.value));
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-gray-400">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      );
    }

    case 'richtext':
      return (
        <RichTextEditor
          label={label}
          content={typeof value === 'string' ? value : ''}
          onChange={onChange}
        />
      );

    case 'entity_ref': {
      const filteredEntities = property.entityTypeRef
        ? entities.filter(e => {
            const et = getEntityType(e.typeId);
            return et && (et.id === property.entityTypeRef || et.slug === property.entityTypeRef || et.name === property.entityTypeRef);
          })
        : entities;

      const searched = filteredEntities.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase())
      );

      const selectedEntity = typeof value === 'string' ? entities.find(e => e.id === value) : null;

      return (
        <div className="flex flex-col gap-1 relative">
          <span className="text-sm font-medium text-gray-300">{label}</span>
          <div className="relative">
            <input
              type="text"
              value={open ? search : (selectedEntity?.name || '')}
              onFocus={() => { setOpen(true); setSearch(''); }}
              onBlur={() => setTimeout(() => setOpen(false), 150)}
              onChange={e => setSearch(e.target.value)}
              placeholder="Entität suchen..."
              className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            {open && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-700"
                  onMouseDown={() => { onChange(null); setOpen(false); }}
                >
                  — Keine Auswahl —
                </button>
                {searched.map(e => {
                  const et = getEntityType(e.typeId);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2',
                        value === e.id ? 'bg-accent-500/20 text-accent-400' : 'text-gray-200',
                      )}
                      onMouseDown={() => { onChange(e.id); setOpen(false); }}
                    >
                      {et && (
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: et.color }}
                        />
                      )}
                      {e.name}
                    </button>
                  );
                })}
                {searched.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Keine Ergebnisse</div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}
