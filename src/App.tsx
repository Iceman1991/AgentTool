import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { seedDatabase } from './seed';
import { useEntityTypeStore } from './stores/entityTypeStore';
import { useEntityStore } from './stores/entityStore';
import { useRelationshipStore } from './stores/relationshipStore';
import { useTimelineStore } from './stores/timelineStore';
import { useNotePageStore } from './stores/notePageStore';
import { useFamilyTreeStore } from './stores/familyTreeStore';
import { useTimelineMetaStore } from './stores/timelineMetaStore';
import { useEntityFolderStore } from './stores/entityFolderStore';
import { useWorkspaceStore } from './stores/workspaceStore';
import { useAuthStore } from './stores/authStore';
import { useMapStore } from './stores/mapStore';
import { AuthPage } from './pages/AuthPage';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-accent-500 animate-spin" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-accent-400 mb-1">Campaign Manager</h1>
        <p className="text-gray-400 text-sm">Daten werden geladen...</p>
      </div>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, authLoading, initialize } = useAuthStore();

  const loadEntityTypes = useEntityTypeStore(s => s.load);
  const loadEntities = useEntityStore(s => s.load);
  const loadRelationships = useRelationshipStore(s => s.load);
  const loadTimeline = useTimelineStore(s => s.load);
  const loadNotePages = useNotePageStore(s => s.load);
  const loadFamilyTrees = useFamilyTreeStore(s => s.load);
  const loadTimelineMeta = useTimelineMetaStore(s => s.load);
  const loadEntityFolders = useEntityFolderStore(s => s.load);
  const loadWorkspaces = useWorkspaceStore(s => s.load);
  const loadMaps = useMapStore(s => s.load);
  // Step 1: initialize auth (check existing session)
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Step 2: once authenticated, load all data stores
  useEffect(() => {
    if (!user) return;
    setReady(false);
    setError(null);

    async function init() {
      try {
        await seedDatabase();
        await loadWorkspaces();
        await Promise.all([
          loadEntityTypes(),
          loadEntities(),
          loadRelationships(),
          loadTimeline(),
          loadNotePages(),
          loadFamilyTrees(),
          loadTimelineMeta(),
          loadEntityFolders(),
          loadMaps(),
        ]);
        setReady(true);
      } catch (err) {
        console.error('Failed to initialize:', err);
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    }
    init();
  }, [user, loadEntityTypes, loadEntities, loadRelationships, loadTimeline, loadNotePages, loadFamilyTrees, loadTimelineMeta, loadEntityFolders, loadWorkspaces, loadMaps]);

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4 p-8">
        <div className="text-red-500 text-5xl">!</div>
        <h1 className="font-display text-2xl font-bold text-gray-100">Initialisierungsfehler</h1>
        <p className="text-gray-400 text-center max-w-md">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 transition-colors"
        >
          Neu laden
        </button>
      </div>
    );
  }

  // Auth is still being checked (first load)
  if (authLoading) return <LoadingScreen />;

  // Not logged in → show login/register
  if (!user) return <AuthPage />;

  // Logged in but data not yet loaded
  if (!ready) return <LoadingScreen />;

  return <RouterProvider router={router} />;
}
