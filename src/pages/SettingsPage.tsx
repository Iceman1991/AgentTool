import { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EntityTypeForm } from '../components/forms/EntityTypeForm';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ColorPicker } from '../components/ui/ColorPicker';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useEntityStore } from '../stores/entityStore';
import { useRelationshipStore } from '../stores/relationshipStore';
import type { EntityType, RelationshipType } from '../types';
import { uid, getNextColor } from '../lib/utils';

function RelationshipTypeForm({
  relType,
  onSave,
  onCancel,
}: {
  relType?: RelationshipType;
  onSave: () => void;
  onCancel: () => void;
}) {
  const { createRelationshipType, updateRelationshipType, relationshipTypes } = useRelationshipStore();
  const usedColors = relationshipTypes.filter(r => r.id !== relType?.id).map(r => r.color);

  const [label, setLabel] = useState(relType?.label || '');
  const [inverseLabel, setInverseLabel] = useState(relType?.inverseLabel || '');
  const [color, setColor] = useState(relType?.color || getNextColor(usedColors));
  const [direction, setDirection] = useState<'directed' | 'undirected'>(relType?.direction || 'undirected');
  const [isFamilial, setIsFamilial] = useState(relType?.isFamilial || false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    try {
      if (relType) {
        await updateRelationshipType(relType.id, { label, inverseLabel: inverseLabel || undefined, color, direction, isFamilial });
      } else {
        await createRelationshipType({ id: uid(), label, inverseLabel: inverseLabel || undefined, color, direction, isFamilial });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Bezeichnung *" value={label} onChange={e => setLabel(e.target.value)} required />
      <Input label="Inverse Bezeichnung" value={inverseLabel} onChange={e => setInverseLabel(e.target.value)} placeholder="z.B. 'Kind von' bei 'Elternteil von'" />
      <Select
        label="Richtung"
        value={direction}
        onChange={e => setDirection(e.target.value as 'directed' | 'undirected')}
        options={[
          { value: 'undirected', label: 'Bidirektional' },
          { value: 'directed', label: 'Gerichtet' },
        ]}
      />
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isFamilial}
          onChange={e => setIsFamilial(e.target.checked)}
          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-accent-500"
        />
        <span className="text-sm text-gray-400">Familiäre Beziehung (für Stammbaum)</span>
      </label>
      <ColorPicker label="Farbe" value={color} onChange={setColor} />
      <div className="flex gap-2 justify-end pt-2 border-t border-gray-700">
        <Button type="button" variant="ghost" onClick={onCancel}>Abbrechen</Button>
        <Button type="submit" variant="primary" loading={saving}>
          {relType ? 'Speichern' : 'Erstellen'}
        </Button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('entity-types');
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const entities = useEntityStore(s => s.entities);
  const { deleteEntityType } = useEntityTypeStore();
  const { deleteEntity } = useEntityStore();
  const { relationshipTypes, deleteRelationshipType } = useRelationshipStore();

  const [editingEntityType, setEditingEntityType] = useState<EntityType | null>(null);
  const [editingRelType, setEditingRelType] = useState<RelationshipType | null>(null);
  const [createEntityTypeOpen, setCreateEntityTypeOpen] = useState(false);
  const [createRelTypeOpen, setCreateRelTypeOpen] = useState(false);
  const [deleteEntityTypeTarget, setDeleteEntityTypeTarget] = useState<EntityType | null>(null);
  const [deleteRelTypeTarget, setDeleteRelTypeTarget] = useState<RelationshipType | null>(null);

  const handleDeleteEntityType = async () => {
    if (!deleteEntityTypeTarget) return;
    // Delete all entities of this type first (cascades to relationships)
    const typeEntities = entities.filter(e => e.typeId === deleteEntityTypeTarget.id);
    for (const entity of typeEntities) {
      await deleteEntity(entity.id);
    }
    await deleteEntityType(deleteEntityTypeTarget.id);
    setDeleteEntityTypeTarget(null);
  };

  const tabs = [
    { id: 'entity-types', label: 'Entitäts-Typen' },
    { id: 'relationship-types', label: 'Beziehungs-Typen' },
  ];

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-gray-100">Einstellungen</h1>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Entity Types */}
      {activeTab === 'entity-types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">Entitäts-Typen ({entityTypes.length})</h2>
            <Button variant="primary" size="sm" onClick={() => setCreateEntityTypeOpen(true)}>
              <Plus size={14} /> Neuer Typ
            </Button>
          </div>

          <div className="space-y-3">
            {entityTypes.map(et => {
              const count = entities.filter(e => e.typeId === et.id).length;
              return (
                <div
                  key={et.id}
                  className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: et.color + '22', color: et.color }}
                  >
                    <span className="font-bold">{et.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-200">{et.name}</h3>
                      {et.isSystem && <Badge size="sm">System</Badge>}
                    </div>
                    {et.description && (
                      <p className="text-sm text-gray-500 truncate">{et.description}</p>
                    )}
                    <p className="text-xs text-gray-600">{et.properties.length} Felder • {count} Einträge</p>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: et.color }}
                  />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingEntityType(et)}>
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteEntityTypeTarget(et)}
                      disabled={entityTypes.length <= 1}
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Relationship Types */}
      {activeTab === 'relationship-types' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-200">Beziehungs-Typen ({relationshipTypes.length})</h2>
            <Button variant="primary" size="sm" onClick={() => setCreateRelTypeOpen(true)}>
              <Plus size={14} /> Neuer Typ
            </Button>
          </div>

          <div className="space-y-3">
            {relationshipTypes.map(rt => (
              <div
                key={rt.id}
                className="flex items-center gap-4 p-4 bg-gray-800 border border-gray-700 rounded-xl"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: rt.color + '22' }}
                >
                  <div className="w-4 h-0.5 rounded" style={{ backgroundColor: rt.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-200">{rt.label}</h3>
                    {rt.inverseLabel && (
                      <span className="text-xs text-gray-500">↔ {rt.inverseLabel}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge size="sm">{rt.direction === 'directed' ? 'Gerichtet' : 'Bidirektional'}</Badge>
                    {rt.isFamilial && <Badge size="sm" color="#DB2777">Familiär</Badge>}
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: rt.color }}
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRelType(rt)}>
                    <Edit2 size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteRelTypeTarget(rt)}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={createEntityTypeOpen} onClose={() => setCreateEntityTypeOpen(false)} title="Neuer Entitäts-Typ" size="lg">
        <EntityTypeForm onSave={() => setCreateEntityTypeOpen(false)} onCancel={() => setCreateEntityTypeOpen(false)} />
      </Modal>

      <Modal isOpen={!!editingEntityType} onClose={() => setEditingEntityType(null)} title={`Bearbeiten: ${editingEntityType?.name}`} size="lg">
        {editingEntityType && (
          <EntityTypeForm
            entityType={editingEntityType}
            onSave={() => setEditingEntityType(null)}
            onCancel={() => setEditingEntityType(null)}
          />
        )}
      </Modal>

      <Modal isOpen={createRelTypeOpen} onClose={() => setCreateRelTypeOpen(false)} title="Neuer Beziehungs-Typ" size="sm">
        <RelationshipTypeForm onSave={() => setCreateRelTypeOpen(false)} onCancel={() => setCreateRelTypeOpen(false)} />
      </Modal>

      <Modal isOpen={!!editingRelType} onClose={() => setEditingRelType(null)} title={`Bearbeiten: ${editingRelType?.label}`} size="sm">
        {editingRelType && (
          <RelationshipTypeForm
            relType={editingRelType}
            onSave={() => setEditingRelType(null)}
            onCancel={() => setEditingRelType(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteEntityTypeTarget}
        onClose={() => setDeleteEntityTypeTarget(null)}
        onConfirm={handleDeleteEntityType}
        title="Entitäts-Typ löschen"
        message={`Möchtest du "${deleteEntityTypeTarget?.name}" löschen? Alle Einträge dieses Typs werden ebenfalls gelöscht!`}
      />

      <ConfirmDialog
        isOpen={!!deleteRelTypeTarget}
        onClose={() => setDeleteRelTypeTarget(null)}
        onConfirm={async () => {
          if (deleteRelTypeTarget) {
            await deleteRelationshipType(deleteRelTypeTarget.id);
            setDeleteRelTypeTarget(null);
          }
        }}
        title="Beziehungs-Typ löschen"
        message={`Möchtest du "${deleteRelTypeTarget?.label}" löschen?`}
      />
    </div>
  );
}
