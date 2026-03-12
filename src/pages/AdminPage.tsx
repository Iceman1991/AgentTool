import { useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface AdminUser {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
}

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { session, user: currentUser } = useAuthStore();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin?action=users', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Fehler'); setLoading(false); return; }
      setUsers(data.users);
    } catch {
      setError('Verbindungsfehler');
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`User "${email}" wirklich löschen?\nAlle Daten dieses Users werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    setDeleting(userId);
    const res = await fetch(`/api/admin?action=delete&userId=${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setUsers(u => u.filter(user => user.id !== userId));
    } else {
      alert(data.error ?? 'Fehler beim Löschen');
    }
    setDeleting(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      {!loading && !error && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-400">{users.length} Benutzer</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">E-Mail</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Registriert</th>
                <th className="text-left px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">Letzter Login</th>
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
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      u.email_confirmed_at
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                    }`}>
                      {u.email_confirmed_at ? 'Bestätigt' : 'Unbestätigt'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(u.id, u.email ?? u.id)}
                        disabled={deleting === u.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-900/30 text-red-400 hover:bg-red-900/60 disabled:opacity-40 rounded-lg transition-colors"
                      >
                        <Trash2 size={11} />
                        {deleting === u.id ? 'Löschen...' : 'Löschen'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-600">
        Hinweis: Setze <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-400">ADMIN_EMAIL</code> und <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-400">SUPABASE_SERVICE_ROLE_KEY</code> in den Vercel-Umgebungsvariablen.
      </p>
    </div>
  );
}
