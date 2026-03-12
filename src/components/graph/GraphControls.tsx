import { Search, X } from 'lucide-react';
import type { EntityType, RelationshipType } from '../../types';

interface GraphControlsProps {
  entityTypes: EntityType[];
  relationshipTypes: RelationshipType[];
  filterEntityTypeIds: string[];
  filterRelTypeIds: string[];
  searchQuery: string;
  onToggleEntityType: (id: string) => void;
  onToggleRelType: (id: string) => void;
  onSearchChange: (q: string) => void;
}

export function GraphControls({
  entityTypes,
  relationshipTypes,
  filterEntityTypeIds,
  filterRelTypeIds,
  searchQuery,
  onToggleEntityType,
  onToggleRelType,
  onSearchChange,
}: GraphControlsProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex flex-col gap-4 w-64 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Suche</h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Entitäten suchen..."
            className="w-full bg-gray-900 border border-gray-600 text-gray-100 rounded-md pl-8 pr-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Entitäten-Typen
        </h3>
        <div className="flex flex-col gap-1.5">
          {entityTypes.map(et => {
            const active = filterEntityTypeIds.length === 0 || filterEntityTypeIds.includes(et.id);
            return (
              <label key={et.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleEntityType(et.id)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800"
                  style={{ accentColor: et.color }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: et.color }}
                />
                <span className="text-sm text-gray-300">{et.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Beziehungs-Typen
        </h3>
        <div className="flex flex-col gap-1.5">
          {relationshipTypes.map(rt => {
            const active = filterRelTypeIds.length === 0 || filterRelTypeIds.includes(rt.id);
            return (
              <label key={rt.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleRelType(rt.id)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800"
                  style={{ accentColor: rt.color }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: rt.color }}
                />
                <span className="text-sm text-gray-300">{rt.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
