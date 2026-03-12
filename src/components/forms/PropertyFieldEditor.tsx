import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, ChevronDown, ChevronUp, Plus, X, Copy } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { uid } from '../../lib/utils';
import type { PropertyDefinition, PropertyType, SelectOption } from '../../types';

interface PropertyFieldEditorProps {
  property: PropertyDefinition;
  onChange: (id: string, updates: Partial<PropertyDefinition>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  entityTypeOptions?: { value: string; label: string }[];
}

const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Zahl' },
  { value: 'date', label: 'Datum' },
  { value: 'boolean', label: 'Ja/Nein' },
  { value: 'select', label: 'Auswahl' },
  { value: 'multiselect', label: 'Mehrfachauswahl' },
  { value: 'richtext', label: 'Formatierter Text' },
  { value: 'entity_ref', label: 'Entität-Verweis' },
];

export function PropertyFieldEditor({ property, onChange, onDelete, onDuplicate, entityTypeOptions = [] }: PropertyFieldEditorProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: property.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const addOption = () => {
    const newOpt: SelectOption = { value: uid().slice(0, 8), label: 'Neu' };
    onChange(property.id, { options: [...(property.options || []), newOpt] });
  };

  const updateOption = (idx: number, updates: Partial<SelectOption>) => {
    const opts = [...(property.options || [])];
    opts[idx] = { ...opts[idx], ...updates };
    onChange(property.id, { options: opts });
  };

  const removeOption = (idx: number) => {
    const opts = (property.options || []).filter((_, i) => i !== idx);
    onChange(property.id, { options: opts });
  };

  const needsOptions = property.type === 'select' || property.type === 'multiselect';
  const needsEntityRef = property.type === 'entity_ref';

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>

        <div className="flex-1 grid grid-cols-2 gap-2">
          <Input
            placeholder="Feldname"
            value={property.name}
            onChange={e => onChange(property.id, { name: e.target.value })}
          />
          <Select
            value={property.type}
            onChange={e => onChange(property.id, { type: e.target.value as PropertyType })}
            options={PROPERTY_TYPE_OPTIONS}
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={property.required}
            onChange={e => onChange(property.id, { required: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-accent-500"
          />
          Pflicht
        </label>

        {(needsOptions || needsEntityRef) && (
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-gray-400 hover:text-gray-200 p-1"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}

        <button
          type="button"
          onClick={() => onDuplicate(property.id)}
          className="text-gray-500 hover:text-gray-300 p-1"
          title="Feld duplizieren"
        >
          <Copy size={14} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(property.id)}
          className="text-gray-500 hover:text-red-400 p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {expanded && needsOptions && (
        <div className="px-3 pb-3 border-t border-gray-700 pt-3">
          <p className="text-xs text-gray-500 mb-2">Auswahloptionen:</p>
          <div className="flex flex-col gap-2">
            {(property.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  placeholder="Wert"
                  value={opt.value}
                  onChange={e => updateOption(idx, { value: e.target.value, label: e.target.value })}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={opt.color || '#6B7280'}
                  onChange={e => updateOption(idx, { color: e.target.value })}
                  className="w-8 h-8 rounded border-0 cursor-pointer"
                  title="Farbe"
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={addOption}>
              <Plus size={14} /> Option hinzufügen
            </Button>
          </div>
        </div>
      )}

      {expanded && needsEntityRef && (
        <div className="px-3 pb-3 border-t border-gray-700 pt-3">
          <Select
            label="Verweist auf Typ"
            value={property.entityTypeRef || ''}
            onChange={e => onChange(property.id, { entityTypeRef: e.target.value || undefined })}
            options={entityTypeOptions}
            placeholder="Alle Typen"
          />
        </div>
      )}
    </div>
  );
}
