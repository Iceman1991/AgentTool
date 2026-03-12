import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Network, TreePine, Clock, Settings,
  Plus, ChevronLeft, ChevronRight, Circle, FileText, ChevronDown, Trash2,
  Briefcase, Check, LogOut, Pencil, X, ShieldAlert,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { useEntityStore } from '../../stores/entityStore';
import { useNotePageStore } from '../../stores/notePageStore';
import { useFamilyTreeStore } from '../../stores/familyTreeStore';
import { useTimelineMetaStore } from '../../stores/timelineMetaStore';
import { useEntityFolderStore } from '../../stores/entityFolderStore';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';
import type { EntityType, NotePage } from '../../types';

type LucideIconComponent = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

function EntityTypeIcon({ iconName, size = 15 }: { iconName: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[iconName];
  return Icon ? <Icon size={size} /> : <Circle size={size} />;
}

function NavItem({ to, icon, label, collapsed, badge }: {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  badge?: number;
}) {
  const { closeMobileSidebar } = useUIStore();
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={closeMobileSidebar}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
        isActive
          ? 'bg-accent-500/15 text-accent-400 shadow-inner-glow'
          : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200',
        collapsed && 'justify-center px-2',
      )}
    >
      <span className="flex-shrink-0 opacity-80">{icon}</span>
      {!collapsed && (
        <>
          <span className="truncate flex-1">{label}</span>
          {badge !== undefined && badge > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md font-medium tabular-nums bg-accent-500/10 text-accent-400">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// Recursive page tree item
interface PageTreeItemProps {
  page: NotePage;
  allPages: NotePage[];
  depth: number;
  collapsed: boolean;
  maxDepth?: number;
}

function PageTreeItem({ page, allPages, depth, collapsed, maxDepth = 3 }: PageTreeItemProps) {
  const navigate = useNavigate();
  const children = allPages.filter(p => p.parentId === page.id);
  const hasChildren = children.length > 0;
  const [expanded, setExpanded] = useState(false);

  if (collapsed) return null;

  return (
    <div>
      <div
        className="flex items-center group"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren && depth < maxDepth ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
            className="w-4 h-4 flex items-center justify-center text-gray-600 hover:text-gray-400 flex-shrink-0 mr-0.5"
          >
            <ChevronDown
              size={12}
              className={cn('transition-transform', expanded ? 'rotate-0' : '-rotate-90')}
            />
          </button>
        ) : (
          <span className="w-4 flex-shrink-0 mr-0.5" />
        )}
        <NavLink
          to={`/pages/${page.id}`}
          className={({ isActive }) => cn(
            'flex items-center gap-1.5 flex-1 py-1 pr-2 rounded-lg text-[13px] truncate',
            isActive
              ? 'text-accent-400'
              : 'text-gray-400 hover:text-gray-200',
          )}
        >
          <span className="text-sm leading-none">{page.icon}</span>
          <span className="truncate">{page.title}</span>
        </NavLink>
        <button
          type="button"
          title="Unterseite hinzufügen"
          onClick={async (e) => {
            e.stopPropagation();
            const store = useNotePageStore.getState();
            const newPage = await store.createPage({ parentId: page.id });
            navigate(`/pages/${newPage.id}`);
          }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-300 flex-shrink-0"
        >
          <Plus size={11} />
        </button>
      </div>
      {hasChildren && expanded && depth < maxDepth && (
        <div>
          {children.map(child => (
            <PageTreeItem
              key={child.id}
              page={child}
              allPages={allPages}
              depth={depth + 1}
              collapsed={collapsed}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const entities = useEntityStore(s => s.entities);
  const notePages = useNotePageStore(s => s.notePages);
  const familyTrees = useFamilyTreeStore(s => s.familyTrees);
  const timelines = useTimelineMetaStore(s => s.timelines);
  const { sidebarCollapsed, toggleSidebar, openModal, closeMobileSidebar } = useUIStore();
  const { signOut } = useAuthStore();
  const { workspaces, currentWorkspaceId, switchWorkspace, createWorkspace, updateWorkspace, deleteWorkspace } = useWorkspaceStore();
  const loadEntityTypes = useEntityTypeStore(s => s.load);
  const loadEntities = useEntityStore(s => s.load);
  const loadNotePages = useNotePageStore(s => s.load);
  const loadEntityFolders = useEntityFolderStore(s => s.load);
  const [wsMenuOpen, setWsMenuOpen] = useState(false);
  const [addingWs, setAddingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingWsName, setEditingWsName] = useState('');

  const currentWs = workspaces.find(w => w.id === currentWorkspaceId);

  const handleSwitchWorkspace = async (id: string) => {
    switchWorkspace(id);
    setWsMenuOpen(false);
    // Reload all workspace-scoped stores
    await Promise.all([loadEntityTypes(), loadEntities(), loadNotePages(), loadEntityFolders()]);
    navigate('/');
    closeMobileSidebar();
  };

  const handleCreateWorkspace = async () => {
    if (!newWsName.trim()) return;
    const ws = await createWorkspace(newWsName.trim());
    setNewWsName('');
    setAddingWs(false);
    await handleSwitchWorkspace(ws.id);
  };

  const entityCountByType = (typeId: string) => entities.filter(e => e.typeId === typeId).length;

  const rootPages = notePages.filter(p => !p.parentId);

  return (
    <aside
      className={cn(
        'flex flex-col h-full transition-all duration-200 flex-shrink-0',
        'bg-gray-900 border-r border-white/[0.06]',
        sidebarCollapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Workspace switcher / Logo */}
      <div className={cn(
        'relative border-b border-white/[0.06]',
        sidebarCollapsed ? 'px-2 py-4 flex justify-center' : 'px-3 py-3',
      )}>
        {!sidebarCollapsed ? (
          <>
            <button
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-800/60 transition-colors text-left"
              onClick={() => setWsMenuOpen(v => !v)}
            >
              <div className="w-7 h-7 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Briefcase size={13} className="text-accent-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-200 truncate leading-tight">{currentWs?.name ?? 'Standard'}</p>
                <p className="text-[10px] text-gray-500 leading-tight">Workspace</p>
              </div>
              <ChevronDown size={12} className={cn('text-gray-500 transition-transform flex-shrink-0', wsMenuOpen && 'rotate-180')} />
            </button>

            {wsMenuOpen && (
              <div className="absolute left-2 right-2 top-full mt-1 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-50 py-1">
                {workspaces.map(ws => (
                  <div key={ws.id} className="group flex items-center gap-1 px-2 py-0.5">
                    {editingWsId === ws.id ? (
                      <div className="flex items-center gap-1 flex-1 px-1">
                        <input
                          autoFocus
                          value={editingWsName}
                          onChange={e => setEditingWsName(e.target.value)}
                          onKeyDown={async e => {
                            if (e.key === 'Enter' && editingWsName.trim()) {
                              await updateWorkspace(ws.id, { name: editingWsName.trim() });
                              setEditingWsId(null);
                            }
                            if (e.key === 'Escape') setEditingWsId(null);
                          }}
                          className="flex-1 bg-gray-800 border border-accent-500/50 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none"
                        />
                        <button
                          className="p-1 rounded bg-accent-500 text-white"
                          onClick={async () => {
                            if (editingWsName.trim()) {
                              await updateWorkspace(ws.id, { name: editingWsName.trim() });
                            }
                            setEditingWsId(null);
                          }}
                        ><Check size={11} /></button>
                        <button className="p-1 rounded text-gray-500 hover:text-gray-300" onClick={() => setEditingWsId(null)}><X size={11} /></button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="flex items-center gap-2 flex-1 py-1.5 text-sm text-left rounded-lg px-1 hover:bg-gray-800"
                          onClick={() => handleSwitchWorkspace(ws.id)}
                        >
                          <Briefcase size={12} className="text-gray-500 flex-shrink-0" />
                          <span className={cn('flex-1 truncate', ws.id === currentWorkspaceId ? 'text-accent-400' : 'text-gray-300')}>
                            {ws.name}
                          </span>
                          {ws.id === currentWorkspaceId && <Check size={11} className="text-accent-400 flex-shrink-0" />}
                        </button>
                        <button
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-gray-700 flex-shrink-0"
                          title="Umbenennen"
                          onClick={e => { e.stopPropagation(); setEditingWsId(ws.id); setEditingWsName(ws.name); }}
                        ><Pencil size={11} /></button>
                        {ws.id !== 'default-workspace' && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-gray-700 flex-shrink-0"
                            title="Löschen"
                            onClick={async e => {
                              e.stopPropagation();
                              if (confirm(`Workspace "${ws.name}" wirklich löschen? Alle Inhalte werden in Standard verschoben.`)) {
                                await deleteWorkspace(ws.id);
                              }
                            }}
                          ><Trash2 size={11} /></button>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="border-t border-gray-700/50 my-1" />
                {addingWs ? (
                  <div className="px-2 pb-2 flex gap-1">
                    <input
                      autoFocus
                      value={newWsName}
                      onChange={e => setNewWsName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleCreateWorkspace(); if (e.key === 'Escape') setAddingWs(false); }}
                      placeholder="Name..."
                      className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100 focus:outline-none focus:border-accent-500"
                    />
                    <button className="p-1.5 rounded bg-accent-500 text-white text-xs" onClick={handleCreateWorkspace}><Check size={11} /></button>
                  </div>
                ) : (
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                    onClick={() => setAddingWs(true)}
                  >
                    <Plus size={11} /> Neuer Workspace
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <button
            className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center"
            onClick={() => setWsMenuOpen(v => !v)}
          >
            <Briefcase size={13} className="text-accent-400" />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
        <NavItem to="/" icon={<LayoutDashboard size={15} />} label="Dashboard" collapsed={sidebarCollapsed} />
        <NavItem to="/graph" icon={<Network size={15} />} label="Beziehungsgraph" collapsed={sidebarCollapsed} />
        <NavItem
          to="/family-tree"
          icon={<TreePine size={15} />}
          label="Stammbaum"
          collapsed={sidebarCollapsed}
          badge={familyTrees.length}
        />
        <NavItem
          to="/timeline"
          icon={<Clock size={15} />}
          label="Zeitleiste"
          collapsed={sidebarCollapsed}
          badge={timelines.length}
        />

        {/* Pages section */}
        {!sidebarCollapsed ? (
          <div className="mt-3">
            <div className="flex items-center justify-between mx-1 mb-1">
              <NavLink
                to="/pages"
                className={({ isActive }) => cn(
                  'text-[10px] font-semibold uppercase tracking-widest px-2',
                  isActive ? 'text-accent-400' : 'text-gray-500 hover:text-gray-400',
                )}
              >
                SEITEN {notePages.length > 0 ? `(${notePages.length})` : ''}
              </NavLink>
              <button
                onClick={async () => {
                  const store = useNotePageStore.getState();
                  const newPage = await store.createPage();
                  navigate(`/pages/${newPage.id}`);
                }}
                className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-gray-800/60"
                title="Neue Seite"
              >
                <Plus size={12} />
              </button>
            </div>
            {rootPages.length === 0 ? (
              <button
                onClick={async () => {
                  const store = useNotePageStore.getState();
                  const newPage = await store.createPage();
                  navigate(`/pages/${newPage.id}`);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800/60"
              >
                <Plus size={11} /> Erste Seite erstellen
              </button>
            ) : (
              rootPages.map(page => (
                <PageTreeItem
                  key={page.id}
                  page={page}
                  allPages={notePages}
                  depth={0}
                  collapsed={sidebarCollapsed}
                />
              ))
            )}
          </div>
        ) : (
          <NavLink
            to="/pages"
            className={({ isActive }) => cn(
              'flex items-center justify-center px-2 py-2 rounded-lg text-sm font-medium',
              isActive
                ? 'bg-accent-500/15 text-accent-400 shadow-inner-glow'
                : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200',
            )}
          >
            <span className="flex-shrink-0 opacity-80"><FileText size={15} /></span>
          </NavLink>
        )}

        {/* Entity types section */}
        {entityTypes.length > 0 && (
          <>
            <div className="mt-5 mb-1.5 mx-1">
              {!sidebarCollapsed ? (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest px-2">
                    Entitäten
                  </span>
                  <button
                    onClick={() => openModal({ type: 'createEntityType' })}
                    className="p-1 rounded text-gray-600 hover:text-gray-400 hover:bg-gray-800/60"
                    title="Neuer Typ"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <div className="border-t border-white/[0.06] my-1" />
              )}
            </div>

            {entityTypes.map((et: EntityType) => (
              <NavLink
                key={et.id}
                to={`/type/${et.slug}`}
                className={({ isActive }) => cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-gray-800/80 text-gray-100'
                    : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200',
                  sidebarCollapsed && 'justify-center px-2',
                )}
              >
                <span className="flex-shrink-0" style={{ color: et.color }}>
                  <EntityTypeIcon iconName={et.icon} />
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate text-[13px]">{et.name}</span>
                    <span
                      className="text-[11px] px-1.5 py-0.5 rounded-md font-medium tabular-nums"
                      style={{ backgroundColor: et.color + '1a', color: et.color }}
                    >
                      {entityCountByType(et.id)}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}

        {entityTypes.length === 0 && !sidebarCollapsed && (
          <button
            onClick={() => openModal({ type: 'createEntityType' })}
            className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-gray-800/60 border border-dashed border-white/[0.06]"
          >
            <Plus size={12} /> Ersten Typ erstellen
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-white/[0.06] flex flex-col gap-0.5 flex-shrink-0">
        <NavItem to="/trash" icon={<Trash2 size={15} />} label="Papierkorb" collapsed={sidebarCollapsed} />
        <NavItem to="/settings" icon={<Settings size={15} />} label="Einstellungen" collapsed={sidebarCollapsed} />
        <NavItem to="/admin" icon={<ShieldAlert size={15} />} label="Admin" collapsed={sidebarCollapsed} />
        <button
          onClick={() => signOut()}
          title="Abmelden"
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-800/60 hover:text-red-400',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          <span className="flex-shrink-0 opacity-80"><LogOut size={15} /></span>
          {!sidebarCollapsed && <span className="truncate flex-1">Abmelden</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full py-1.5 text-gray-600 hover:text-gray-400 rounded-lg hover:bg-gray-800/60"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
