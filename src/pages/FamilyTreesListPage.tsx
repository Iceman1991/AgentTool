import { useNavigate } from 'react-router-dom';
import { Plus, TreePine, Users } from 'lucide-react';
import { useFamilyTreeStore } from '../stores/familyTreeStore';
import { useEntityStore } from '../stores/entityStore';
import { cn } from '../lib/utils';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function FamilyTreesListPage() {
  const navigate = useNavigate();
  const { familyTrees, createFamilyTree } = useFamilyTreeStore();
  const entities = useEntityStore(s => s.entities);

  const sorted = [...familyTrees].sort((a, b) => b.updatedAt - a.updatedAt);

  const handleCreate = async () => {
    const tree = await createFamilyTree();
    navigate(`/family-tree/${tree.id}`);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100">Stammbäume</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {familyTrees.length === 0
              ? 'Noch keine Stammbäume'
              : `${familyTrees.length} Stammbaum${familyTrees.length !== 1 ? 'bäume' : ''}`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Neuer Stammbaum
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <TreePine size={32} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-1">Noch keine Stammbäume</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Erstelle einen Stammbaum, um familiäre Beziehungen zwischen Charakteren darzustellen.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Ersten Stammbaum erstellen
          </button>
        </div>
      )}

      {/* Grid */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(tree => {
            const rootEntity = tree.rootEntityId
              ? entities.find(e => e.id === tree.rootEntityId)
              : undefined;
            return (
              <button
                key={tree.id}
                type="button"
                onClick={() => navigate(`/family-tree/${tree.id}`)}
                className={cn(
                  'group flex flex-col gap-3 p-4 bg-gray-800 rounded-xl border border-white/[0.06]',
                  'hover:border-white/[0.12] hover:bg-gray-800/80 transition-all text-left',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                    <TreePine size={20} className="text-accent-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 truncate group-hover:text-accent-400 transition-colors">
                      {tree.name}
                    </h3>
                    {tree.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{tree.description}</p>
                    )}
                  </div>
                </div>

                {rootEntity && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users size={11} />
                    <span>Ausgangsperson: {rootEntity.name}</span>
                  </div>
                )}

                <div className="text-xs text-gray-600 mt-auto">
                  Geändert: {formatDate(tree.updatedAt)}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
