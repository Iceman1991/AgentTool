import { useState } from 'react';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { RichTextEditor } from '../ui/RichTextEditor';
import { Button } from '../ui/Button';
import { useRelationshipStore } from '../../stores/relationshipStore';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import type { Relationship } from '../../types';
import { cn } from '../../lib/utils';

interface RelationshipFormProps {
  sourceEntityId?: string;
  relationship?: Relationship;
  onSave: () => void;
  onCancel: () => void;
}

export function RelationshipForm({ sourceEntityId, relationship, onSave, onCancel }: RelationshipFormProps) {
  const { relationshipTypes, createRelationship, updateRelationship } = useRelationshipStore();
  const entities = useEntityStore(s => s.entities);
  const getEntityType = useEntityTypeStore(s => s.getEntityType);

  const [sourceId, setSourceId] = useState(relationship?.sourceId || sourceEntityId || '');
  const [targetId, setTargetId] = useState(relationship?.targetId || '');
  const [typeId, setTypeId] = useState(relationship?.typeId || (relationshipTypes[0]?.id || ''));
  const [label, setLabel] = useState(relationship?.label || '');
  const [notes, setNotes] = useState(relationship?.notes || '');
  const [targetSearch, setTargetSearch] = useState('');
  const [targetOpen, setTargetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const targetEntity = entities.find(e => e.id === targetId);
  const filteredTargets = entities.filter(e =>
    e.id !== sourceId &&
    e.name.toLowerCase().includes(targetSearch.toLowerCase())
  );

  const relTypeOptions = relationshipTypes.map(rt => ({ value: rt.id, label: rt.label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || !typeId) return;
    setSaving(true);
    try {
      if (relationship) {
        await updateRelationship(relationship.id, { sourceId, targetId, typeId, label: label || undefined, notes: notes || undefined });
      } else {
        await createRelationship({ sourceId, targetId, typeId, label: label || undefined, notes: notes || undefined, isFamilial: false });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-300">Von</span>
          <Select
            value={sourceId}
            onChange={e => setSourceId(e.target.value)}
            options={entities.map(e => ({ value: e.id, label: e.name }))}
            placeholder="Entität wählen..."
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-300">Nach</span>
          <div className="relative">
            <input
              type="text"
              value={targetOpen ? targetSearch : (targetEntity?.name || '')}
              onFocus={() => { setTargetOpen(true); setTargetSearch(''); }}
              onBlur={() => setTimeout(() => setTargetOpen(false), 150)}
              onChange={e => setTargetSearch(e.target.value)}
              placeholder="Entität suchen..."
              className="w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            {targetOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-xl max-h-48 overflow-y-auto">
                {filteredTargets.map(e => {
                  const et = getEntityType(e.typeId);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-gray-700 flex items-center gap-2',
                        targetId === e.id ? 'bg-accent-500/20 text-accent-400' : 'text-gray-200',
                      )}
                      onMouseDown={() => { setTargetId(e.id); setTargetOpen(false); }}
                    >
                      {et && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: et.color }} />}
                      {e.name}
                    </button>
                  );
                })}
                {filteredTargets.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">Keine Ergebnisse</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Select
        label="Beziehungstyp"
        value={typeId}
        onChange={e => setTypeId(e.target.value)}
        options={relTypeOptions}
        placeholder="Typ wählen..."
      />

      <Input
        label="Bezeichnung (optional)"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Benutzerdefiniertes Label..."
      />

      <RichTextEditor
        label="Notizen (optional)"
        content={notes}
        onChange={setNotes}
        minHeight="64px"
        placeholder="Notizen zur Beziehung... (@Name für Verlinkung)"
      />

      <div className="flex gap-2 justify-end pt-2 border-t border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" variant="primary" loading={saving} disabled={!sourceId || !targetId || !typeId}>
          {relationship ? 'Speichern' : 'Hinzufügen'}
        </Button>
      </div>
    </form>
  );
}
