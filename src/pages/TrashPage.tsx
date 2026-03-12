import { useEffect } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { useTrashStore } from '../stores/trashStore';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { cn } from '../lib/utils';

export function TrashPage() {
  const { trashedEntities, trashedPages, loading, load, restoreEntity, restoreNotePage, permanentDeleteEntity, permanentDeleteNotePage, emptyTrash } = useTrashStore();
  const entityTypes = useEntityTypeStore(s => s.entityTypes);

  useEffect(() => { load(); }, [load]);

  const totalCount = trashedEntities.length + trashedPages.length;

  const handleEmptyTrash = () => {
    if (!window.confirm(`Alle ${totalCount} Elemente dauerhaft löschen? Dies kann nicht rückgängig gemacht werden.`)) return;
    emptyTrash();
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Trash2 size={22} className="text-gray-500" />
            Papierkorb
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalCount === 0 ? 'Papierkorb ist leer' : `${totalCount} Element${totalCount !== 1 ? 'e' : ''} im Papierkorb`}
          </p>
        </div>
        {totalCount > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20"
          >
            <Trash2 size={14} />
            Papierkorb leeren
          </button>
        )}
      </div>

      {loading && (
        <p className="text-gray-500 text-sm">Lade...</p>
      )}

      {!loading && totalCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
            <Trash2 size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-500 text-sm">Der Papierkorb ist leer.</p>
        </div>
      )}

      {/* Deleted Entities */}
      {trashedEntities.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Entitäten ({trashedEntities.length})
          </h2>
          <div className="flex flex-col gap-2">
            {trashedEntities.map(entity => {
              const entityType = entityTypes.find(et => et.id === entity.typeId);
              return (
                <div
                  key={entity.id}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-white/[0.06]"
                >
                  <div
                    className="w-1.5 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entityType?.color || '#6B7280' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{entity.name}</p>
                    <p className="text-xs text-gray-500">
                      {entityType?.name || 'Unbekannt'}
                      {entity.deletedAt ? ` · Gelöscht ${new Date(entity.deletedAt).toLocaleDateString('de-DE')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => restoreEntity(entity.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-accent-400 hover:bg-accent-500/10 transition-colors',
                      )}
                      title="Wiederherstellen"
                    >
                      <RotateCcw size={12} />
                      Wiederherstellen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`"${entity.name}" dauerhaft löschen?`)) permanentDeleteEntity(entity.id);
                      }}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-colors"
                      title="Dauerhaft löschen"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Deleted Pages */}
      {trashedPages.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Seiten ({trashedPages.length})
          </h2>
          <div className="flex flex-col gap-2">
            {trashedPages.map(page => (
              <div
                key={page.id}
                className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl border border-white/[0.06]"
              >
                <span className="text-xl flex-shrink-0">{page.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{page.title}</p>
                  <p className="text-xs text-gray-500">
                    Seite
                    {page.deletedAt ? ` · Gelöscht ${new Date(page.deletedAt).toLocaleDateString('de-DE')}` : ''}
                    {page.parentId ? ' · Unterseite' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => restoreNotePage(page.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-accent-400 hover:bg-accent-500/10 transition-colors',
                    )}
                    title="Wiederherstellen"
                  >
                    <RotateCcw size={12} />
                    Wiederherstellen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`"${page.title}" dauerhaft löschen?`)) permanentDeleteNotePage(page.id);
                    }}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-colors"
                    title="Dauerhaft löschen"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl text-xs text-yellow-400/80">
          <AlertTriangle size={13} className="flex-shrink-0" />
          <span>Elemente im Papierkorb werden nicht automatisch gelöscht. Leere den Papierkorb manuell um Speicherplatz freizugeben.</span>
        </div>
      )}
    </div>
  );
}
