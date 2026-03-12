import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home, AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center p-8">
      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center">
        <AlertTriangle size={40} className="text-yellow-500" />
      </div>
      <div>
        <h1 className="font-display text-4xl font-bold text-gray-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-300 mb-3">Seite nicht gefunden</h2>
        <p className="text-gray-500 max-w-md">
          Diese Seite existiert nicht oder wurde verschoben.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>Zurück</Button>
        <Button variant="primary" onClick={() => navigate('/')}>
          <Home size={16} /> Dashboard
        </Button>
      </div>
    </div>
  );
}
