import { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';
import { ImageUpload } from '../ui/ImageUpload';
import { RichTextEditor } from '../ui/RichTextEditor';
import { DynamicField } from './DynamicField';
import { useEntityStore } from '../../stores/entityStore';
import type { Entity, EntityType, PropertyValue } from '../../types';

interface EntityFormProps {
  entityType: EntityType;
  entity?: Entity;
  onSave: (entity: Entity) => void;
  onCancel: () => void;
}

export function EntityForm({ entityType, entity, onSave, onCancel }: EntityFormProps) {
  const { createEntity, updateEntity } = useEntityStore();

  const [name, setName] = useState(entity?.name || '');
  const [summary, setSummary] = useState(entity?.summary || '');
  const [imageUrl, setImageUrl] = useState<string | null>(entity?.imageUrl || null);
  const [tags, setTags] = useState<string[]>(entity?.tags || []);
  const [properties, setProperties] = useState<Record<string, PropertyValue>>(
    entity?.properties || {}
  );
  const [saving, setSaving] = useState(false);

  const sortedProps = [...entityType.properties].sort((a, b) => a.order - b.order);

  const setProperty = (key: string, value: PropertyValue) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (entity) {
        await updateEntity(entity.id, {
          name: name.trim(),
          summary: summary.trim() || undefined,
          imageUrl: imageUrl || undefined,
          tags,
          properties,
        });
        onSave({ ...entity, name: name.trim(), summary: summary.trim() || undefined, imageUrl: imageUrl || undefined, tags, properties });
      } else {
        const created = await createEntity({
          typeId: entityType.id,
          name: name.trim(),
          summary: summary.trim() || undefined,
          imageUrl: imageUrl || undefined,
          tags,
          properties,
        });
        onSave(created);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Image upload at top */}
      <ImageUpload
        value={imageUrl}
        onChange={setImageUrl}
        label="Bild"
      />

      <Input
        label="Name *"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={`${entityType.name}-Name...`}
        required
      />

      <RichTextEditor
        label="Zusammenfassung"
        content={summary}
        onChange={setSummary}
        minHeight="72px"
        placeholder="Kurze Beschreibung... (@Name für Verlinkung)"
      />

      {sortedProps.length > 0 && (
        <div className="border-t border-white/[0.07] pt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Eigenschaften
          </h3>
          <div className="flex flex-col gap-4">
            {sortedProps.map(prop => (
              <DynamicField
                key={prop.id}
                property={prop}
                value={properties[prop.key] ?? null}
                onChange={val => setProperty(prop.key, val)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/[0.07] pt-4">
        <TagInput label="Tags" value={tags} onChange={setTags} />
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-white/[0.07]">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {entity ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}
