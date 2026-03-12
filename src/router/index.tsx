import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { EntityTypePage } from '../pages/EntityTypePage';
import { EntityDetailPage } from '../pages/EntityDetailPage';
import { GraphPage } from '../pages/GraphPage';
import { FamilyTreesListPage } from '../pages/FamilyTreesListPage';
import { FamilyTreePage } from '../pages/FamilyTreePage';
import { TimelinesListPage } from '../pages/TimelinesListPage';
import { TimelinePage } from '../pages/TimelinePage';
import { SettingsPage } from '../pages/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { NotePagesListPage } from '../pages/NotePagesListPage';
import { NotePageDetailPage } from '../pages/NotePageDetailPage';
import { TrashPage } from '../pages/TrashPage';
import { AdminPage } from '../pages/AdminPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'type/:slug', element: <EntityTypePage /> },
      { path: 'entities/:id', element: <EntityDetailPage /> },
      { path: 'graph', element: <GraphPage /> },
      { path: 'family-tree', element: <FamilyTreesListPage /> },
      { path: 'family-tree/:id', element: <FamilyTreePage /> },
      { path: 'timeline', element: <TimelinesListPage /> },
      { path: 'timeline/:id', element: <TimelinePage /> },
      { path: 'pages', element: <NotePagesListPage /> },
      { path: 'pages/:id', element: <NotePageDetailPage /> },
      { path: 'trash', element: <TrashPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
