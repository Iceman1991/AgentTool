import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { cn } from '../../lib/utils';

const ICON_NAMES = [
  'User', 'Users', 'UserCheck', 'MapPin', 'Map', 'Building', 'Building2',
  'Sword', 'Shield', 'Crown', 'Star', 'Skull', 'Heart', 'Zap', 'Flame',
  'Scroll', 'BookOpen', 'Book', 'Feather', 'Wand', 'WandSparkles',
  'Package', 'Gem', 'Coins', 'Key', 'Lock', 'Unlock',
  'Globe', 'Mountain', 'Trees', 'Landmark', 'Church', 'Castle',
  'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond',
  'Flag', 'Target', 'Crosshair', 'Dagger', 'Axe', 'Bow',
  'Sparkles', 'Moon', 'Sun', 'CloudLightning', 'Wind', 'Waves',
  'Bug', 'Bird', 'Fish', 'PawPrint', 'Dragon',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

type LucideIconComponent = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = ICON_NAMES.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
      <input
        type="text"
        placeholder="Icon suchen..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-gray-900 border border-gray-600 text-gray-100 rounded px-2 py-1 text-sm"
      />
      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
        {filtered.map(name => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name];
          if (!Icon) return null;
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              className={cn(
                'p-2 rounded transition-colors',
                value === name
                  ? 'bg-accent-500 text-white'
                  : 'hover:bg-gray-700 text-gray-400 hover:text-gray-200',
              )}
            >
              <Icon size={16} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
