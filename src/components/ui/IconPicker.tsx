import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { cn } from '../../lib/utils';

const ICON_NAMES = [
  'User', 'Users', 'UserCheck', 'MapPin', 'Map', 'Building', 'Building2',
  'Swords', 'Sword', 'Shield', 'Crown', 'Star', 'Skull', 'Heart', 'Zap', 'Flame',
  'Scroll', 'BookOpen', 'Book', 'Feather', 'Wand', 'WandSparkles',
  'Package', 'Gem', 'Coins', 'Key', 'Lock', 'Unlock',
  'Globe', 'Mountain', 'MountainSnow', 'Trees', 'TreePine', 'Landmark', 'Church', 'Castle',
  'Circle', 'Square', 'Triangle', 'Hexagon', 'Diamond',
  'Flag', 'Target', 'Crosshair', 'Axe', 'Pickaxe',
  'Sparkles', 'Moon', 'Sun', 'CloudLightning', 'Wind', 'Waves',
  'Bug', 'Bird', 'Fish', 'PawPrint',
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

type LucideIconComponent = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const available = ICON_NAMES.filter(
    name => !!(LucideIcons as unknown as Record<string, unknown>)[name]
  );

  const filtered = available.filter(name =>
    name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
      <input
        type="text"
        placeholder="Icon suchen..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '6px',
          backgroundColor: '#141419',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {filtered.map(name => {
          const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name];
          const isSelected = value === name;
          return (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => onChange(name)}
              style={{
                flexShrink: 0,
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#C49A4A' : 'transparent',
                color: isSelected ? '#fff' : '#8A8070',
                transition: 'background-color 120ms, color 120ms',
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1c1c23';
                  (e.currentTarget as HTMLButtonElement).style.color = '#EDE8DC';
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = '#8A8070';
                }
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p style={{ color: '#4A4438', fontSize: '12px', padding: '12px', width: '100%', textAlign: 'center' }}>
            Kein Icon gefunden
          </p>
        )}
      </div>
    </div>
  );
}
