import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { Users } from 'lucide-react';
import type { Entity, EntityType } from '../../types';

interface EntityTableProps {
  entities: Entity[];
  entityTypes: EntityType[];
  onCreateEntity?: () => void;
}

type SortField = 'name' | 'createdAt' | 'type';
type SortDir = 'asc' | 'desc';

export function EntityTable({ entities, entityTypes, onCreateEntity }: EntityTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sorted = [...entities].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') cmp = a.name.localeCompare(b.name, 'de');
    else if (sortField === 'createdAt') cmp = a.createdAt - b.createdAt;
    else if (sortField === 'type') {
      const ta = typeMap.get(a.typeId)?.name || '';
      const tb = typeMap.get(b.typeId)?.name || '';
      cmp = ta.localeCompare(tb, 'de');
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronsUpDown size={14} className="text-gray-600" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-accent-400" />
      : <ChevronDown size={14} className="text-accent-400" />;
  }

  if (entities.length === 0) {
    return (
      <EmptyState
        icon={<Users size={32} />}
        title="Keine Einträge vorhanden"
        description="Erstelle deinen ersten Eintrag für diesen Typ."
        actionLabel={onCreateEntity ? 'Neuer Eintrag' : undefined}
        onAction={onCreateEntity}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
          <tr>
            <th
              className="px-4 py-3 cursor-pointer hover:text-gray-200 select-none"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-1">Name <SortIcon field="name" /></div>
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-gray-200 select-none"
              onClick={() => handleSort('type')}
            >
              <div className="flex items-center gap-1">Typ <SortIcon field="type" /></div>
            </th>
            <th className="px-4 py-3">Tags</th>
            <th
              className="px-4 py-3 cursor-pointer hover:text-gray-200 select-none"
              onClick={() => handleSort('createdAt')}
            >
              <div className="flex items-center gap-1">Erstellt <SortIcon field="createdAt" /></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {sorted.map(entity => {
            const entityType = typeMap.get(entity.typeId);
            return (
              <tr
                key={entity.id}
                className="hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => navigate(`/entities/${entity.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-100">{entity.name}</td>
                <td className="px-4 py-3">
                  {entityType && (
                    <Badge color={entityType.color}>{entityType.name}</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {entity.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded text-xs">{tag}</span>
                    ))}
                    {entity.tags.length > 3 && (
                      <span className="text-xs text-gray-600">+{entity.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(entity.createdAt).toLocaleDateString('de-DE')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
