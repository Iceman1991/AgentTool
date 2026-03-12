import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Plus, SmilePlus, FileText } from 'lucide-react';
import type { NotePage, PageBlock } from '../../types';
import { useNotePageStore } from '../../stores/notePageStore';
import { BlockEditor, AddBlockMenu } from './BlockEditor';
import { cn } from '../../lib/utils';

const EMOJI_OPTIONS = ['📄', '📝', '🗺️', '⚔️', '🏰', '🐉', '📜', '🌍', '💀', '🎲', '🗡️', '🔮', '🌿', '👑', '⚗️', '🌙'];

interface NotePageEditorProps {
  page: NotePage;
}

export function NotePageEditor({ page }: NotePageEditorProps) {
  const navigate = useNavigate();
  const { updatePage, addBlock, updateBlock, deleteBlock, reorderBlocks, createPage, notePages } = useNotePageStore();

  const childPages = notePages.filter(p => p.parentId === page.id);

  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [addMenuInsertAfter, setAddMenuInsertAfter] = useState<string | null>(null);
  const [newBlockId, setNewBlockId] = useState<string | null>(null);

  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Sort blocks by order
  const blocks = [...page.blocks].sort((a, b) => a.order - b.order);

  // Sync local state when navigating to a different page
  useEffect(() => {
    setTitle(page.title);
    setIcon(page.icon);
  }, [page.id]);

  // Title debounce save
  useEffect(() => {
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      updatePage(page.id, { title });
    }, 500);
    return () => { if (titleDebounce.current) clearTimeout(titleDebounce.current); };
  }, [title, page.id, updatePage]);

  // Icon save
  const handleIconSelect = (emoji: string) => {
    setIcon(emoji);
    setShowEmojiPicker(false);
    updatePage(page.id, { icon: emoji });
  };

  // Close add menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
        setAddMenuInsertAfter(null);
      }
    };
    if (showAddMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(blocks, oldIndex, newIndex);
    reorderBlocks(page.id, reordered.map(b => b.id));
  }, [blocks, page.id, reorderBlocks]);

  const handleAddBlock = useCallback(async (type: PageBlock['type'], insertAfter?: string | null) => {
    const newBlock = await addBlock(page.id, type);
    setNewBlockId(newBlock.id);
    // If insertAfter: reorder to place new block right after
    if (insertAfter) {
      const currentBlocks = useNotePageStore.getState().notePages.find(p => p.id === page.id)?.blocks ?? [];
      const sorted = [...currentBlocks].sort((a, b) => a.order - b.order);
      const afterIndex = sorted.findIndex(b => b.id === insertAfter);
      if (afterIndex !== -1) {
        const withoutNew = sorted.filter(b => b.id !== newBlock.id);
        const insertPos = afterIndex + 1;
        const reordered = [
          ...withoutNew.slice(0, insertPos),
          newBlock,
          ...withoutNew.slice(insertPos),
        ];
        reorderBlocks(page.id, reordered.map(b => b.id));
      }
    }
  }, [page.id, addBlock, reorderBlocks]);

  const openAddMenuBelow = (blockId: string) => {
    setAddMenuInsertAfter(blockId);
    setShowAddMenu(true);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-8 px-4">
      {/* Title area */}
      <div className="flex items-start gap-3">
        {/* Icon picker */}
        <div className="relative">
          <button
            type="button"
            title="Icon ändern"
            onClick={() => setShowEmojiPicker(v => !v)}
            className="text-4xl leading-none hover:scale-110 transition-transform cursor-pointer"
          >
            {icon}
          </button>
          {showEmojiPicker && (
            <div style={{
              position: 'absolute', top: '52px', left: 0, zIndex: 30,
              backgroundColor: '#1f2937', border: '1px solid #374151',
              borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              padding: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px', width: '232px',
            }}>
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => handleIconSelect(e)}
                  style={{
                    flexShrink: 0, width: '32px', height: '32px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '20px',
                    backgroundColor: icon === e ? '#374151' : 'transparent',
                    transition: 'background-color 120ms',
                  }}
                  onMouseEnter={e2 => { (e2.currentTarget as HTMLButtonElement).style.backgroundColor = '#374151'; }}
                  onMouseLeave={e2 => { (e2.currentTarget as HTMLButtonElement).style.backgroundColor = icon === e ? '#374151' : 'transparent'; }}
                >
                  {e}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                style={{
                  width: '100%', marginTop: '4px', padding: '4px 0',
                  fontSize: '12px', color: '#6b7280', background: 'none',
                  border: 'none', cursor: 'pointer', transition: 'color 120ms',
                }}
                onMouseEnter={e2 => { (e2.currentTarget as HTMLButtonElement).style.color = '#d1d5db'; }}
                onMouseLeave={e2 => { (e2.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
              >
                Schließen
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Seitentitel..."
          className="flex-1 bg-transparent text-3xl font-display font-bold text-gray-100 placeholder-gray-600 outline-none border-none leading-tight mt-1"
        />

        <button
          type="button"
          title="Icon ändern"
          onClick={() => setShowEmojiPicker(v => !v)}
          className="mt-2 p-1.5 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-gray-800 transition-colors"
        >
          <SmilePlus size={16} />
        </button>
      </div>

      {/* Blocks */}
      <div className="flex flex-col gap-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block) => (
              <BlockEditor
                key={block.id}
                block={block}
                autoFocus={block.id === newBlockId}
                onUpdate={(content) => updateBlock(page.id, block.id, content)}
                onDelete={() => deleteBlock(page.id, block.id)}
                onAddBelow={() => openAddMenuBelow(block.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Add block button */}
        <div ref={addMenuRef} className="relative">
          <button
            type="button"
            onClick={() => { setAddMenuInsertAfter(null); setShowAddMenu(v => !v); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-700 hover:border-accent-500/60 text-sm text-gray-500 hover:text-accent-400 transition-colors w-full justify-center"
          >
            <Plus size={15} />
            Block hinzufügen
          </button>
          {showAddMenu && !addMenuInsertAfter && (
            <AddBlockMenu
              onAdd={(type) => handleAddBlock(type, null)}
              onClose={() => setShowAddMenu(false)}
            />
          )}
        </div>
      </div>

      {/* Unterseiten */}
      <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Unterseiten</h3>
          <button
            type="button"
            onClick={async () => {
              const newPage = await createPage({ parentId: page.id });
              navigate(`/pages/${newPage.id}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-accent-400 hover:bg-gray-800 transition-colors"
          >
            <Plus size={12} />
            Unterseite hinzufügen
          </button>
        </div>
        {childPages.length === 0 ? (
          <p className="text-sm text-gray-600 py-2">Keine Unterseiten vorhanden.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {childPages.map(child => (
              <button
                key={child.id}
                type="button"
                onClick={() => navigate(`/pages/${child.id}`)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06]',
                  'bg-gray-800 hover:bg-gray-800/80 hover:border-white/[0.12] transition-all text-left',
                )}
              >
                <span className="text-lg leading-none">{child.icon}</span>
                <span className="text-sm text-gray-300">{child.title}</span>
                <FileText size={12} className="text-gray-600 ml-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
