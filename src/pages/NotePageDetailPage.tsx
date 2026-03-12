import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, Pencil, Eye, Trash2 } from 'lucide-react';
import { useNotePageStore } from '../stores/notePageStore';
import { NotePageEditor } from '../components/pages/NotePageEditor';
import { NotePageViewer } from '../components/pages/NotePageViewer';
import { NotFoundPage } from './NotFoundPage';
import { cn } from '../lib/utils';

export function NotePageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notePages, deletePage } = useNotePageStore();
  const [mode, setMode] = useState<'edit' | 'view'>('edit');

  const page = notePages.find(p => p.id === id);

  if (!page) return <NotFoundPage />;

  const handleDelete = () => {
    if (!window.confirm(`Seite "${page.title}" und alle Unterseiten wirklich löschen?`)) return;
    const parentId = page.parentId;
    deletePage(page.id);
    navigate(parentId ? `/pages/${parentId}` : '/pages');
  };

  // Build breadcrumb path
  const breadcrumb: typeof notePages = [];
  let current = page;
  while (current.parentId) {
    const parent = notePages.find(p => p.id === current.parentId);
    if (!parent) break;
    breadcrumb.unshift(parent);
    current = parent;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Top bar: breadcrumb + mode toggle */}
      <div className="flex items-center justify-between px-6 pt-4 pb-1 gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 flex-wrap min-w-0">
          <button
            type="button"
            onClick={() => navigate('/pages')}
            className="hover:text-gray-300 transition-colors shrink-0"
          >
            Seiten
          </button>
          {breadcrumb.map(ancestor => (
            <span key={ancestor.id} className="flex items-center gap-1 min-w-0">
              <ChevronRight size={13} className="text-gray-700 shrink-0" />
              <button
                type="button"
                onClick={() => navigate(`/pages/${ancestor.id}`)}
                className="hover:text-gray-300 transition-colors truncate"
              >
                <span className="mr-1">{ancestor.icon}</span>
                {ancestor.title}
              </button>
            </span>
          ))}
          {breadcrumb.length > 0 && (
            <span className="flex items-center gap-1 min-w-0">
              <ChevronRight size={13} className="text-gray-700 shrink-0" />
              <span className="text-gray-400 truncate">
                <span className="mr-1">{page.icon}</span>
                {page.title}
              </span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors"
            title="Seite löschen"
          >
            <Trash2 size={14} />
          </button>

        {/* View / Edit toggle */}
        <div className="flex items-center gap-0.5 bg-gray-800 border border-white/[0.07] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-accent-500/20 text-accent-300'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Pencil size={12} />
            Bearbeiten
          </button>
          <button
            type="button"
            onClick={() => setMode('view')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              mode === 'view'
                ? 'bg-accent-500/20 text-accent-300'
                : 'text-gray-500 hover:text-gray-300',
            )}
          >
            <Eye size={12} />
            Ansicht
          </button>
        </div>
        </div>
      </div>

      {mode === 'edit' ? (
        <NotePageEditor page={page} />
      ) : (
        <NotePageViewer page={page} />
      )}
    </div>
  );
}
