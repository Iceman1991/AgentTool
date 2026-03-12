import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Menu, Check, Loader2 } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

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

function ProfileButton() {
  const { user, updateEmail, updatePassword } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'email' | 'password'>('email');
  const [emailVal, setEmailVal] = useState('');
  const [pwVal, setPwVal] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  const handleEmailSave = async () => {
    if (!emailVal.trim()) return;
    setLoading(true); setMsg(null);
    const err = await updateEmail(emailVal.trim());
    setLoading(false);
    setMsg(err ? { text: err, ok: false } : { text: 'Bestätigungs-E-Mail gesendet. Bitte prüfe dein Postfach.', ok: true });
    if (!err) setEmailVal('');
  };

  const handlePwSave = async () => {
    if (!pwVal || pwVal !== pwConfirm) {
      setMsg({ text: 'Passwörter stimmen nicht überein.', ok: false });
      return;
    }
    if (pwVal.length < 6) {
      setMsg({ text: 'Mindestens 6 Zeichen erforderlich.', ok: false });
      return;
    }
    setLoading(true); setMsg(null);
    const err = await updatePassword(pwVal);
    setLoading(false);
    setMsg(err ? { text: err, ok: false } : { text: 'Passwort erfolgreich geändert.', ok: true });
    if (!err) { setPwVal(''); setPwConfirm(''); }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(v => !v); setMsg(null); }}
        title={user?.email ?? 'Profil'}
        style={{
          width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(196,154,74,0.2)', color: '#C49A4A',
          fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer',
          transition: 'background-color 120ms',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(196,154,74,0.35)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(196,154,74,0.2)'; }}
      >
        {initial}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '40px', right: 0, zIndex: 100,
          width: 'min(300px, calc(100vw - 24px))', backgroundColor: '#141419',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.7)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(196,154,74,0.2)', color: '#C49A4A',
                fontSize: '16px', fontWeight: 700,
              }}>
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#EDE8DC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email}
                </div>
                <div style={{ fontSize: '11px', color: '#4A4438', marginTop: '1px' }}>Angemeldet</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {(['email', 'password'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setMsg(null); }}
                style={{
                  flex: 1, padding: '10px', fontSize: '12px', fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: tab === t ? '#C49A4A' : '#8A8070',
                  borderBottom: tab === t ? '2px solid #C49A4A' : '2px solid transparent',
                  transition: 'color 120ms',
                }}
              >
                {t === 'email' ? 'E-Mail ändern' : 'Passwort ändern'}
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tab === 'email' ? (
              <>
                <div style={{ fontSize: '11px', color: '#4A4438' }}>Aktuelle E-Mail: {user?.email}</div>
                <input
                  type="email"
                  placeholder="Neue E-Mail-Adresse"
                  value={emailVal}
                  onChange={e => setEmailVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEmailSave(); }}
                  style={{
                    background: '#1c1c23', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
                    color: '#EDE8DC', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleEmailSave}
                  disabled={loading || !emailVal.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    backgroundColor: '#C49A4A', color: '#fff', border: 'none', cursor: 'pointer',
                    opacity: loading || !emailVal.trim() ? 0.5 : 1, transition: 'opacity 120ms',
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                  Speichern
                </button>
              </>
            ) : (
              <>
                <input
                  type="password"
                  placeholder="Neues Passwort"
                  value={pwVal}
                  onChange={e => setPwVal(e.target.value)}
                  style={{
                    background: '#1c1c23', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
                    color: '#EDE8DC', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
                <input
                  type="password"
                  placeholder="Passwort bestätigen"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePwSave(); }}
                  style={{
                    background: '#1c1c23', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
                    color: '#EDE8DC', outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handlePwSave}
                  disabled={loading || !pwVal || !pwConfirm}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    backgroundColor: '#C49A4A', color: '#fff', border: 'none', cursor: 'pointer',
                    opacity: loading || !pwVal || !pwConfirm ? 0.5 : 1, transition: 'opacity 120ms',
                  }}
                >
                  {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                  Speichern
                </button>
              </>
            )}

            {msg && (
              <div style={{
                fontSize: '12px', padding: '8px 10px', borderRadius: '8px',
                backgroundColor: msg.ok ? 'rgba(125,196,123,0.1)' : 'rgba(196,74,74,0.1)',
                color: msg.ok ? '#7DC47B' : '#E07070',
                border: `1px solid ${msg.ok ? 'rgba(125,196,123,0.2)' : 'rgba(196,74,74,0.2)'}`,
              }}>
                {msg.text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const { toggleMobileSidebar } = useUIStore();
  const entities = useEntityStore(s => s.entities);
  const entityTypes = useEntityTypeStore(s => s.entityTypes);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

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
            className="bg-transparent text-sm text-gray-200 placeholder-gray-500 outline-none w-28 sm:w-44"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-gray-300">
              <X size={12} />
            </button>
          )}
        </div>

        {searchOpen && searchQuery.length > 1 && (
          <div className="absolute right-0 top-full mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-gray-800 border border-white/[0.1] rounded-xl shadow-modal z-50 overflow-hidden">
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

      <ProfileButton />
    </header>
  );
}
