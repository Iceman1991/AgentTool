import { useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, ShieldAlert, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface AdminUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

interface TrashedUser {
  user_id: string;
  email?: string;
  created_at_original?: string;
  deleted_at: number;
  deleted_by_id?: string;
}

type Tab = 'active' | 'trash';

function daysUntilPurge(deletedAt: number): number {
  const msLeft = deletedAt + 30 * 24 * 60 * 60 * 1000 - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

export function AdminPage() {
  const [tab, setTab] = useState<Tab>('active');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [trashedUsers, setTrashedUsers] = useState<TrashedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const { session, user: currentUser } = useAuthStore();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [activeRes, trashRes] = await Promise.all([
        fetch('/api/admin?action=users', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
        fetch('/api/admin?action=trash', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        }),
      ]);
      const activeData = await activeRes.json();
      const trashData = await trashRes.json();
      if (!activeRes.ok) { setError(activeData.error ?? 'Fehler'); setLoading(false); return; }
      setUsers(activeData.users);
      setTrashedUsers(trashData.users ?? []);
    } catch {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleMoveToTrash = async (userId: string, email: string) => {
    if (!confirm(`User "${email}" in den Papierkorb verschieben?\n\nDer Account wird deaktiviert. Nach 30 Tagen wird er automatisch endgültig gelöscht.`)) return;
    setActionUserId(userId);
    const res = await fetch(`/api/admin?action=trash-user&userId=${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (res.ok) {
      await fetchUsers();
    } else {
      alert(data.error ?? 'Fehler');
    }
    setActionUserId(null);
  };

  const handleRestore = async (userId: string, email?: string) => {
    if (!confirm(`User "${email ?? userId}" wiederherstellen?`)) return;
    setActionUserId(userId);
    const res = await fetch(`/api/admin?action=restore-user&userId=${userId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (res.ok) {
      await fetchUsers();
    } else {
      alert(data.error ?? 'Fehler');
    }
    setActionUserId(null);
  };

  const handlePurge = async (userId: string, email?: string) => {
    if (!confirm(`User "${email ?? userId}" ENDGÜLTIG löschen?\n\nAlle Daten dieses Users werden unwiderruflich gelöscht.`)) return;
    setActionUserId(userId);
    const res = await fetch(`/api/admin?action=purge-user&userId=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setTrashedUsers(u => u.filter(t => t.user_id !== userId));
    } else {
      alert(data.error ?? 'Fehler');
    }
    setActionUserId(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert size={22} className="text-accent-400" />
        <h1 className="text-xl font-bold text-gray-100">Admin — Benutzerverwaltung</h1>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="ml-auto p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 disabled:opacity-40"
          title="Neu laden"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-950/50 border border-red-800/50 rounded-xl text-red-400 text-sm">
          {error === 'Keine Berechtigung'
            ? 'Zugriff verweigert. Setze ADMIN_EMAIL in den Vercel-Umgebungsvariablen auf deine E-Mail-Adresse.'
            : error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', padding: '4px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '12px', width: 'fit-content' }}>
        {(['active', 'trash'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              border: 'none', cursor: 'pointer', transition: 'all 120ms',
              backgroundColor: tab === t ? '#1c1c23' : 'transparent',
              color: tab === t ? '#EDE8DC' : '#8A8070',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {t === 'active' ? (
              <><ShieldAlert size={13} /> Benutzer ({users.length})</>
            ) : (
              <><Trash2 size={13} /> Papierkorb {trashedUsers.length > 0 && `(${trashedUsers.length})`}</>
            )}
          </button>
        ))}
      </div>

      {!loading && !error && tab === 'active' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-sm text-gray-400">{users.length} aktive Benutzer</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">E-Mail</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Registriert</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Letzter Login</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <td className="px-4 py-3 text-gray-200 font-medium">
                    {u.email ?? '—'}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-accent-500/20 text-accent-400">Du</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      u.email_confirmed_at ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {u.email_confirmed_at ? 'Bestätigt' : 'Unbestätigt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleMoveToTrash(u.id, u.email ?? u.id)}
                        disabled={actionUserId === u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/60 disabled:opacity-40 rounded-lg transition-colors"
                      >
                        <Trash2 size={11} />
                        {actionUserId === u.id ? '...' : 'Löschen'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && tab === 'trash' && (
        <div>
          {trashedUsers.length === 0 ? (
            <div style={{
              padding: '48px', textAlign: 'center',
              backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
            }}>
              <Trash2 size={32} style={{ color: '#4A4438', margin: '0 auto 12px' }} />
              <p style={{ color: '#8A8070', fontSize: '14px' }}>Papierkorb ist leer</p>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 16px', marginBottom: '16px',
                backgroundColor: 'rgba(196,74,74,0.08)', border: '1px solid rgba(196,74,74,0.2)',
                borderRadius: '12px',
              }}>
                <AlertTriangle size={14} style={{ color: '#E07070', flexShrink: 0 }} />
                <p style={{ fontSize: '12px', color: '#E07070' }}>
                  Benutzer im Papierkorb werden nach 30 Tagen automatisch endgültig gelöscht.
                </p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">E-Mail</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Gelöscht am</th>
                      <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Verbleibend</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashedUsers.map(u => {
                      const days = daysUntilPurge(u.deleted_at);
                      const isUrgent = days <= 3;
                      return (
                        <tr key={u.user_id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                          <td className="px-4 py-3 text-gray-400 font-medium">{u.email ?? u.user_id}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">
                            {new Date(u.deleted_at).toLocaleDateString('de-DE')}
                          </td>
                          <td className="px-4 py-3">
                            <span style={{
                              fontSize: '11px', padding: '2px 8px', borderRadius: '999px', fontWeight: 500,
                              backgroundColor: isUrgent ? 'rgba(196,74,74,0.15)' : 'rgba(196,154,74,0.1)',
                              color: isUrgent ? '#E07070' : '#C49A4A',
                            }}>
                              {days === 0 ? 'Wird gelöscht...' : `${days} Tag${days === 1 ? '' : 'e'}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => handleRestore(u.user_id, u.email)}
                                disabled={actionUserId === u.user_id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-900/30 text-green-400 hover:bg-green-900/60 disabled:opacity-40 rounded-lg transition-colors"
                              >
                                <RotateCcw size={11} />
                                Wiederherstellen
                              </button>
                              <button
                                onClick={() => handlePurge(u.user_id, u.email)}
                                disabled={actionUserId === u.user_id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/60 disabled:opacity-40 rounded-lg transition-colors"
                              >
                                <Trash2 size={11} />
                                Endgültig löschen
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
