import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { ColorPicker } from '../ui/ColorPicker';
import { IconPicker } from '../ui/IconPicker';
import { PropertyFieldEditor } from './PropertyFieldEditor';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { uid, generateKey, getNextColor, generateSlug } from '../../lib/utils';
import type { EntityType, PropertyDefinition, PropertyType } from '../../types';

interface EntityTypeFormProps {
  entityType?: EntityType;
  onSave: () => void;
  onCancel: () => void;
}

export function EntityTypeForm({ entityType, onSave, onCancel }: EntityTypeFormProps) {
  const { createEntityType, updateEntityType, entityTypes } = useEntityTypeStore();

  const usedColors = entityTypes.filter(t => t.id !== entityType?.id).map(t => t.color);

  const [name, setName] = useState(entityType?.name || '');
  const [description, setDescription] = useState(entityType?.description || '');
  const [color, setColor] = useState(entityType?.color || getNextColor(usedColors));
  const [icon, setIcon] = useState(entityType?.icon || 'Circle');
  const [properties, setProperties] = useState<PropertyDefinition[]>(
    entityType?.properties ? [...entityType.properties].sort((a, b) => a.order - b.order) : []
  );
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addProperty = () => {
    const newProp: PropertyDefinition = {
      id: uid(),
      name: 'Neues Feld',
      key: `field_${Date.now()}`,
      type: 'text',
      required: false,
      order: properties.length,
    };
    setProperties(prev => [...prev, newProp]);
  };

  const updateProperty = (id: string, updates: Partial<PropertyDefinition>) => {
    setProperties(prev => prev.map(p =>
      p.id === id
        ? { ...p, ...updates, key: updates.name ? generateKey(updates.name) : p.key }
        : p
    ));
  };

  const deleteProperty = (id: string) => {
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const duplicateProperty = (id: string) => {
    setProperties(prev => {
      const source = prev.find(p => p.id === id);
      if (!source) return prev;
      const copy: PropertyDefinition = {
        ...source,
        id: uid(),
        name: `${source.name} (Kopie)`,
        key: `${source.key}_copy`,
        order: prev.length,
      };
      return [...prev, copy];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setProperties(prev => {
        const oldIdx = prev.findIndex(p => p.id === active.id);
        const newIdx = prev.findIndex(p => p.id === over.id);
        return arrayMove(prev, oldIdx, newIdx).map((p, i) => ({ ...p, order: i }));
      });
    }
  };

  const entityTypeOptions = entityTypes.map(et => ({ value: et.id, label: et.name }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const propsWithOrder = properties.map((p, i) => ({ ...p, order: i }));
      if (entityType) {
        await updateEntityType(entityType.id, {
          name: name.trim(),
          slug: generateSlug(name.trim()),
          description: description.trim() || undefined,
          color,
          icon,
          properties: propsWithOrder,
        });
      } else {
        await createEntityType({
          name: name.trim(),
          slug: generateSlug(name.trim()),
          description: description.trim() || undefined,
          color,
          icon,
          properties: propsWithOrder,
          isSystem: false,
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4">
        <Input
          label="Name *"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="z.B. NPC, Ort, Fraktion..."
          required
        />
        <Textarea
          label="Beschreibung"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optionale Beschreibung..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ColorPicker label="Farbe" value={color} onChange={setColor} />
        <IconPicker label="Icon" value={icon} onChange={setIcon} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Felder ({properties.length})</h3>
          <Button type="button" variant="ghost" size="sm" onClick={addProperty}>
            <Plus size={14} /> Feld hinzufügen
          </Button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={properties.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {properties.map(prop => (
                <PropertyFieldEditor
                  key={prop.id}
                  property={prop}
                  onChange={updateProperty}
                  onDelete={deleteProperty}
                  onDuplicate={duplicateProperty}
                  entityTypeOptions={entityTypeOptions}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {properties.length === 0 && (
          <p className="text-sm text-gray-600 text-center py-4">
            Noch keine Felder. Klicke auf "Feld hinzufügen".
          </p>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {entityType ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}

// suppress unused warning
export type { PropertyType };
