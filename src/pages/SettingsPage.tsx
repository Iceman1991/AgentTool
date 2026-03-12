import { useState, useCallback } from 'react';
import { Edit2, Trash2, Plus, Download, CheckCircle, AlertCircle, Archive } from 'lucide-react';
import JSZip from 'jszip';
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
import { useTimelineStore } from '../stores/timelineStore';
import { useTimelineMetaStore } from '../stores/timelineMetaStore';
import { useNotePageStore } from '../stores/notePageStore';
import type { EntityType, RelationshipType } from '../types';
import { uid, getNextColor } from '../lib/utils';

/* ── helpers ── */
function base64ToUint8(dataUrl: string): { data: Uint8Array; mime: string } | null {
  try {
    const [header, b64] = dataUrl.split(',');
    if (!header || !b64) return null;
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const raw = atob(b64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return { data: arr, mime };
  } catch {
    return null;
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_').substring(0, 80);
}

/* ── Foundry Export Tab ── */
function FoundryExportTab() {
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const entities = useEntityStore(s => s.entities);
  const timelines = useTimelineMetaStore(s => s.timelines);
  const events = useTimelineStore(s => s.events);
  const notePages = useNotePageStore(s => s.notePages);

  const [exporting, setExporting] = useState(false);
  const [log, setLog] = useState<{ type: 'ok' | 'err' | 'info'; msg: string }[]>([]);

  const addLog = (type: 'ok' | 'err' | 'info', msg: string) =>
    setLog(prev => [...prev, { type, msg }]);

  const exportAsZip = useCallback(async () => {
    setExporting(true);
    setLog([]);
    const zip = new JSZip();

    try {
      // ── Entities grouped by type ──
      for (const et of entityTypes) {
        const typeEntities = entities.filter(e => e.typeId === et.id && !e.deletedAt);
        if (typeEntities.length === 0) continue;

        const folderName = sanitizeFilename(et.name);
        const folder = zip.folder(folderName)!;
        addLog('info', `${folderName}/ (${typeEntities.length} Einträge)`);

        let imgCount = 0;
        for (const entity of typeEntities) {
          if (entity.imageUrl && entity.imageUrl.startsWith('data:')) {
            const result = base64ToUint8(entity.imageUrl);
            if (result) {
              const ext = result.mime.includes('png') ? 'png' : 'jpg';
              folder.file(`${sanitizeFilename(entity.name)}.${ext}`, result.data);
              imgCount++;
            }
          }
        }
        if (imgCount > 0) addLog('ok', `  ${imgCount} Bilder hinzugefügt`);

        // JSON manifest
        const manifest = typeEntities.map(e => ({
          name: e.name,
          summary: e.summary || '',
          tags: e.tags,
          properties: e.properties,
          image: e.imageUrl
            ? `${sanitizeFilename(e.name)}.${e.imageUrl.includes('png') ? 'png' : 'jpg'}`
            : null,
        }));
        folder.file('_manifest.json', JSON.stringify(manifest, null, 2));
        addLog('ok', `  _manifest.json hinzugefügt`);
      }

      // ── Timelines ──
      if (timelines.length > 0) {
        const tlFolder = zip.folder('Zeitleisten')!;
        addLog('info', `Zeitleisten/ (${timelines.length} Zeitleisten)`);
        for (const tl of timelines) {
          const tlEvents = events.filter(e => e.timelineId === tl.id);
          tlFolder.file(
            `${sanitizeFilename(tl.name)}.json`,
            JSON.stringify({
              name: tl.name,
              description: tl.description || '',
              events: tlEvents.map(e => ({
                title: e.title,
                description: e.description,
                date: e.date,
                endDate: e.endDate,
                category: e.category,
                color: e.color,
                session: e.session,
              })),
            }, null, 2),
          );
        }
        addLog('ok', `  ${timelines.length} Zeitleisten hinzugefügt`);
      }

      // ── Note pages ──
      if (notePages.length > 0) {
        const npFolder = zip.folder('Notizen')!;
        addLog('info', `Notizen/ (${notePages.length} Seiten)`);
        for (const np of notePages) {
          npFolder.file(
            `${sanitizeFilename(np.title || 'Unbenannt')}.html`,
            np.content || '',
          );
        }
        addLog('ok', `  ${notePages.length} Notizen hinzugefügt`);
      }

      // ── Generate & download ZIP ──
      addLog('info', 'ZIP wird erstellt...');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campaign-export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addLog('ok', `Download gestartet (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (err) {
      addLog('err', `Fehler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }, [entityTypes, entities, timelines, events, notePages]);

  const totalEntities = entities.filter(e => !e.deletedAt).length;
  const totalImages = entities.filter(e => !e.deletedAt && e.imageUrl?.startsWith('data:')).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-200 mb-1">Foundry VTT Export</h2>
        <p className="text-sm text-gray-400">
          Exportiere alle Entitäten, Bilder, Zeitleisten und Notizen als ZIP-Datei.
          Entpacke die ZIP in dein Foundry <code className="text-gray-300">Data/</code> Verzeichnis.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Entitäten', value: totalEntities },
          { label: 'Bilder', value: totalImages },
          { label: 'Zeitleisten', value: timelines.length },
          { label: 'Notizen', value: notePages.length },
        ].map(s => (
          <div key={s.label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-accent-400">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Folder structure preview */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-2">Inhalt der ZIP-Datei</h3>
        <pre className="text-xs text-gray-500 font-mono leading-relaxed">
{`campaign-export.zip
${entityTypes
  .filter(et => entities.some(e => e.typeId === et.id && !e.deletedAt))
  .map(et => {
    const count = entities.filter(e => e.typeId === et.id && !e.deletedAt).length;
    const imgs = entities.filter(e => e.typeId === et.id && !e.deletedAt && e.imageUrl?.startsWith('data:')).length;
    return `├── ${sanitizeFilename(et.name)}/ (${count} Einträge, ${imgs} Bilder, _manifest.json)`;
  }).join('\n')}
${timelines.length > 0 ? `├── Zeitleisten/ (${timelines.length} JSON-Dateien)` : ''}
${notePages.length > 0 ? `└── Notizen/ (${notePages.length} HTML-Dateien)` : ''}`.trim()}
        </pre>
      </div>

      {/* Export button */}
      <Button
        variant="primary"
        onClick={exportAsZip}
        disabled={exporting || (totalEntities === 0 && timelines.length === 0 && notePages.length === 0)}
        loading={exporting}
        className="w-full sm:w-auto"
      >
        <Archive size={14} /> {exporting ? 'Erstelle ZIP...' : 'Als ZIP herunterladen'}
      </Button>

      <p className="text-xs text-gray-500">
        Entpacke die ZIP anschließend z.B. nach <code className="text-gray-400">FoundryVTT/Data/worlds/deine-welt/assets/</code>.
        Die Bilder können dann als Token-Art oder Journal-Bilder verwendet werden.
      </p>

      {/* Export log */}
      {log.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 max-h-60 overflow-y-auto space-y-1">
          {log.map((l, i) => (
            <div key={i} className="flex items-start gap-2 text-sm font-mono">
              {l.type === 'ok' && <CheckCircle size={14} className="text-green-400 mt-0.5 flex-shrink-0" />}
              {l.type === 'err' && <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />}
              {l.type === 'info' && <span className="text-gray-500 flex-shrink-0">›</span>}
              <span className={l.type === 'err' ? 'text-red-400' : l.type === 'ok' ? 'text-green-400' : 'text-gray-400'}>
                {l.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
    { id: 'foundry', label: 'Foundry VTT' },
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

      {/* Foundry VTT Export */}
      {activeTab === 'foundry' && <FoundryExportTab />}

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
