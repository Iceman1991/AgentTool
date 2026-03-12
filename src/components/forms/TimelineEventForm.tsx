import { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { TagInput } from '../ui/TagInput';
import { RichTextEditor } from '../ui/RichTextEditor';
import { useTimelineStore } from '../../stores/timelineStore';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import type { TimelineEvent, GolarionDate, GolarionMonth, EventCategory } from '../../types';

const GOLARION_MONTHS: { value: GolarionMonth; label: string }[] = [
  { value: 'Abadius', label: 'Abadius (Jan)' },
  { value: 'Calistril', label: 'Calistril (Feb)' },
  { value: 'Pharast', label: 'Pharast (Mär)' },
  { value: 'Gozran', label: 'Gozran (Apr)' },
  { value: 'Desnus', label: 'Desnus (Mai)' },
  { value: 'Sarenith', label: 'Sarenith (Jun)' },
  { value: 'Erastus', label: 'Erastus (Jul)' },
  { value: 'Arodus', label: 'Arodus (Aug)' },
  { value: 'Rova', label: 'Rova (Sep)' },
  { value: 'Lamashan', label: 'Lamashan (Okt)' },
  { value: 'Neth', label: 'Neth (Nov)' },
  { value: 'Kuthona', label: 'Kuthona (Dez)' },
];

const CATEGORIES: { value: EventCategory; label: string }[] = [
  { value: 'combat', label: 'Kampf' },
  { value: 'social', label: 'Sozial' },
  { value: 'exploration', label: 'Erkundung' },
  { value: 'downtime', label: 'Freie Zeit' },
  { value: 'revelation', label: 'Enthüllung' },
  { value: 'death', label: 'Tod' },
  { value: 'milestone', label: 'Meilenstein' },
  { value: 'custom', label: 'Benutzerdefiniert' },
];

const DAYS = Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const YEARS = Array.from({ length: 200 }, (_, i) => {
  const year = 4500 + i;
  return { value: String(year), label: String(year) };
});

interface TimelineEventFormProps {
  event?: TimelineEvent;
  onSave: () => void;
  onCancel: () => void;
}

export function TimelineEventForm({ event, onSave, onCancel }: TimelineEventFormProps) {
  const { createEvent, updateEvent } = useTimelineStore();
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);

  const defaultDate: GolarionDate = { day: 1, month: 'Abadius', year: 4500 };

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState<GolarionDate>(event?.date || defaultDate);
  const [category, setCategory] = useState<EventCategory>(event?.category || 'custom');
  const [linkedEntityIds, setLinkedEntityIds] = useState<string[]>(event?.linkedEntityIds || []);
  const [sessionNumber, setSessionNumber] = useState(event?.sessionNumber?.toString() || '');
  const [tags, setTags] = useState<string[]>(event?.tags || []);
  const [isSecret, setIsSecret] = useState(event?.isSecret || false);
  const [saving, setSaving] = useState(false);

  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  const toggleLinkedEntity = (id: string) => {
    setLinkedEntityIds(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description || undefined,
        date,
        category,
        linkedEntityIds,
        sessionNumber: sessionNumber ? parseInt(sessionNumber) : undefined,
        tags,
        isSecret,
      };
      if (event) {
        await updateEvent(event.id, data);
      } else {
        await createEvent(data);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Titel *"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Ereignis-Titel..."
        required
      />

      <div>
        <span className="text-sm font-medium text-gray-300 block mb-2">Datum (Golarion)</span>
        <div className="grid grid-cols-3 gap-2">
          <Select
            value={String(date.day)}
            onChange={e => setDate(prev => ({ ...prev, day: parseInt(e.target.value) }))}
            options={DAYS}
            placeholder="Tag"
          />
          <Select
            value={date.month}
            onChange={e => setDate(prev => ({ ...prev, month: e.target.value as GolarionMonth }))}
            options={GOLARION_MONTHS}
          />
          <Select
            value={String(date.year)}
            onChange={e => setDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
            options={YEARS}
          />
        </div>
      </div>

      <Select
        label="Kategorie"
        value={category}
        onChange={e => setCategory(e.target.value as EventCategory)}
        options={CATEGORIES}
      />

      <RichTextEditor
        label="Beschreibung"
        content={description}
        onChange={setDescription}
        minHeight="100px"
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray-300">Verknüpfte Entitäten</span>
        <div className="max-h-40 overflow-y-auto border border-gray-700 rounded-lg p-2 flex flex-col gap-1">
          {entities.map(entity => {
            const et = typeMap.get(entity.typeId);
            const checked = linkedEntityIds.includes(entity.id);
            return (
              <label key={entity.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-700 px-2 py-1 rounded">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleLinkedEntity(entity.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500"
                />
                {et && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: et.color }} />}
                <span className="text-sm text-gray-300">{entity.name}</span>
                {et && <span className="text-xs text-gray-500">({et.name})</span>}
              </label>
            );
          })}
          {entities.length === 0 && (
            <p className="text-sm text-gray-600 py-2 text-center">Keine Entitäten vorhanden</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Sitzung Nr."
          type="number"
          value={sessionNumber}
          onChange={e => setSessionNumber(e.target.value)}
          placeholder="Sitzungsnummer..."
        />
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer pb-2">
            <input
              type="checkbox"
              checked={isSecret}
              onChange={e => setIsSecret(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500"
            />
            <span className="text-sm text-gray-400">Geheimes Ereignis</span>
          </label>
        </div>
      </div>

      <TagInput label="Tags" value={tags} onChange={setTags} />

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {event ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}
