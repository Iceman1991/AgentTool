import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Sun, Moon, Monitor, X, Menu } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import type { Theme } from '../../types';
import { cn } from '../../lib/utils';

const THEME_ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={15} />,
  dark: <Moon size={15} />,
  system: <Monitor size={15} />,
};

const THEME_CYCLE: Theme[] = ['dark', 'light', 'system'];

function Breadcrumb() {
  const location = useLocation();
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const getEntity = useEntityStore(s => s.getEntity);

  const parts = location.pathname.split('/').filter(Boolean);

  const getBreadcrumb = () => {
    if (parts.length === 0) return [{ label: 'Dashboard', href: '/' }];
    if (parts[0] === 'type' && parts[1]) {
      const et = entityTypes.find(t => t.slug === parts[1]);
      return [
        { label: 'Dashboard', href: '/' },
        { label: et?.name || parts[1], href: null },
      ];
    }
    if (parts[0] === 'entities' && parts[1]) {
      const entity = getEntity(parts[1]);
      return [
        { label: 'Dashboard', href: '/' },
        { label: entity?.name || 'Entität', href: null },
      ];
    }
    if (parts[0] === 'graph') return [{ label: 'Dashboard', href: '/' }, { label: 'Beziehungsgraph', href: null }];
    if (parts[0] === 'family-tree') return [{ label: 'Dashboard', href: '/' }, { label: 'Stammbaum', href: null }];
    if (parts[0] === 'timeline') return [{ label: 'Dashboard', href: '/' }, { label: 'Zeitleiste', href: null }];
    if (parts[0] === 'settings') return [{ label: 'Dashboard', href: '/' }, { label: 'Einstellungen', href: null }];
    return [{ label: 'Dashboard', href: '/' }];
  };

  const crumbs = getBreadcrumb();

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-600">/</span>}
          {crumb.href ? (
            <a href={crumb.href} className="text-gray-400 hover:text-gray-200 transition-colors">
              {crumb.label}
            </a>
          ) : (
            <span className="text-gray-200 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const { theme, setTheme, toggleMobileSidebar } = useUIStore();
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const cycleTheme = () => {
    const currentIdx = THEME_CYCLE.indexOf(theme);
    const nextTheme = THEME_CYCLE[(currentIdx + 1) % THEME_CYCLE.length];
    setTheme(nextTheme);
  };

  const searchResults = searchQuery.length > 1
    ? entities.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  return (
    <header className="h-12 bg-gray-900/80 backdrop-blur border-b border-white/[0.06] flex items-center gap-3 px-4 flex-shrink-0">
      {/* Hamburger — mobile only */}
      <button
        className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-700/50 flex-shrink-0"
        onClick={toggleMobileSidebar}
        aria-label="Menü öffnen"
      >
        <Menu size={18} />
      </button>

      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Search */}
      <div className="relative">
        <div className={cn(
          'flex items-center gap-2 bg-gray-700/50 border border-white/[0.08] rounded-lg px-3 py-1.5',
          'focus-within:border-accent-500/40 focus-within:bg-gray-700/70',
        )}>
          <Search size={13} className="text-gray-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Suchen..."
            className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-44"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300">
              <X size={12} />
            </button>
          )}
        </div>

        {searchOpen && searchQuery.length > 1 && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-gray-800 border border-white/[0.1] rounded-xl shadow-modal z-50 overflow-hidden">
            {searchResults.length > 0 ? (
              searchResults.map(entity => {
                const et = typeMap.get(entity.typeId);
                return (
                  <button
                    key={entity.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/60 text-left"
                    onMouseDown={() => {
                      navigate(`/entities/${entity.id}`);
                      setSearchQuery('');
                    }}
                  >
                    {et && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: et.color }}
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-200">{entity.name}</p>
                      {et && <p className="text-xs text-gray-500">{et.name}</p>}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">Keine Ergebnisse gefunden</div>
            )}
          </div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={cycleTheme}
        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-700/50"
        title={`Thema: ${theme}`}
      >
        {THEME_ICONS[theme]}
      </button>
    </header>
  );
}
