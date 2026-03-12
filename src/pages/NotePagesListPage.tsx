import { useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, rectSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, FileText, Calendar, Trash2, GripVertical } from 'lucide-react';
import { useNotePageStore } from '../stores/notePageStore';
import { cn } from '../lib/utils';
import type { NotePage } from '../types';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

interface SortablePageCardProps {
  page: NotePage;
  childCount: number;
  onDelete: (e: React.MouseEvent) => void;
}

function SortablePageCard({ page, childCount, onDelete }: SortablePageCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col gap-3 p-4 bg-gray-800 rounded-xl border border-white/[0.06]',
        'hover:border-white/[0.12] hover:bg-gray-800/80 transition-all text-left',
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-3 left-3 p-1 rounded text-gray-600 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
      >
        <GripVertical size={14} />
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-3 right-3 p-1 rounded text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-gray-700 transition-all"
        title="Seite löschen"
      >
        <Trash2 size={13} />
      </button>

      {/* Clickable area */}
      <button
        type="button"
        onClick={() => navigate(`/pages/${page.id}`)}
        className="flex flex-col gap-3 text-left flex-1"
      >
        {/* Icon + title */}
        <div className="flex items-start gap-3 pl-5 pr-5">
          <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{page.icon}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-100 truncate group-hover:text-accent-400 transition-colors">
              {page.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {page.blocks.length} Block{page.blocks.length !== 1 ? 's' : ''}
              {childCount > 0 && ` · ${childCount} Unterseite${childCount !== 1 ? 'n' : ''}`}
            </p>
          </div>
        </div>

        {/* Tags */}
        {page.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pl-5">
            {page.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="text-[11px] px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-gray-600 mt-auto pl-5">
          <Calendar size={11} />
          <span>{formatDate(page.updatedAt)}</span>
        </div>
      </button>
    </div>
  );
}

export function NotePagesListPage() {
  const navigate = useNavigate();
  const { notePages, createPage, deletePage, reorderPages } = useNotePageStore();

  const rootPages = notePages.filter(p => !p.parentId);
  const sorted = [...rootPages].sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex(p => p.id === active.id);
    const newIndex = sorted.findIndex(p => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sorted, oldIndex, newIndex);
    reorderPages(reordered.map(p => p.id));
  };

  const handleCreate = async () => {
    const page = await createPage();
    navigate(`/pages/${page.id}`);
  };

  const handleDelete = (e: React.MouseEvent, pageId: string, title: string) => {
    e.stopPropagation();
    if (!window.confirm(`Seite "${title}" und alle Unterseiten wirklich löschen?`)) return;
    deletePage(pageId);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-100">Seiten</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {rootPages.length === 0 ? 'Noch keine Seiten' : `${rootPages.length} Seite${rootPages.length !== 1 ? 'n' : ''} auf oberster Ebene`}
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} />
          Neue Seite
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
            <FileText size={32} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-1">Noch keine Seiten</h2>
            <p className="text-gray-500 text-sm">Erstelle deine erste Seite mit Blöcken, Zeichnungen und mehr.</p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Erste Seite erstellen
          </button>
        </div>
      )}

      {/* Grid with DnD */}
      {sorted.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map(p => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map(page => (
                <SortablePageCard
                  key={page.id}
                  page={page}
                  childCount={notePages.filter(p => p.parentId === page.id).length}
                  onDelete={(e) => handleDelete(e, page.id, page.title)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* FAB for mobile */}
      <button
        type="button"
        onClick={handleCreate}
        className="fixed bottom-6 right-6 w-12 h-12 bg-accent-500 hover:bg-accent-600 text-white rounded-full shadow-xl flex items-center justify-center transition-colors sm:hidden"
        title="Neue Seite"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}
