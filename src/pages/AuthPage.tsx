import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

type Mode = 'login' | 'register' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, resetPassword } = useAuthStore();

  const reset = (m: Mode) => { setMode(m); setError(null); setInfo(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err);
    } else if (mode === 'register') {
      const err = await signUp(email, password);
      if (err) {
        setError(err);
      } else {
        setInfo('Bestätigungs-E-Mail wurde gesendet. Bitte überprüfe dein Postfach und klicke auf den Link, um dein Konto zu aktivieren.');
      }
    } else {
      const err = await resetPassword(email);
      if (err) {
        setError(err);
      } else {
        setInfo('E-Mail zum Zurücksetzen des Passworts wurde gesendet. Bitte überprüfe dein Postfach.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-accent-400 mb-1">PF2 Kampagne</h1>
          <p className="text-gray-500 text-sm">Deine Kampagnen-Notizen in der Cloud</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6 p-1 bg-gray-800 rounded-lg">
              <button
                type="button"
                onClick={() => reset('login')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'login' ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Anmelden
              </button>
              <button
                type="button"
                onClick={() => reset('register')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  mode === 'register' ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Registrieren
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="mb-6">
              <button type="button" onClick={() => reset('login')} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
                ← Zurück zur Anmeldung
              </button>
              <h2 className="text-base font-semibold text-gray-100 mt-3">Passwort zurücksetzen</h2>
              <p className="text-xs text-gray-500 mt-1">Wir senden dir einen Link zum Zurücksetzen deines Passworts.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                placeholder="name@example.com"
              />
            </div>

            {mode !== 'forgot' && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Passwort</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  minLength={6}
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 text-sm placeholder-gray-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                  placeholder="Mindestens 6 Zeichen"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-lg px-3 py-2">{error}</p>
            )}
            {info && (
              <p className="text-sm text-green-400 bg-green-950/50 border border-green-800/50 rounded-lg px-3 py-2">{info}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 text-white font-medium text-sm rounded-lg transition-colors"
            >
              {loading ? 'Laden...' : mode === 'login' ? 'Anmelden' : mode === 'register' ? 'Konto erstellen' : 'Link senden'}
            </button>

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => reset('forgot')}
                className="w-full text-xs text-gray-500 hover:text-gray-300 text-center py-1 transition-colors"
              >
                Passwort vergessen?
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
