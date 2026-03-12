import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Image as ImageIcon, Pencil, Plus, Columns2 } from 'lucide-react';
import type { PageBlock } from '../../types';
import { RichTextEditor } from '../ui/RichTextEditor';
import { DrawingCanvas } from '../ui/DrawingCanvas';
import { ImageUpload } from '../ui/ImageUpload';
import { cn } from '../../lib/utils';

// Helper for columns block content (stored as JSON)
function parseColumns(content: string): { left: string; right: string } {
  try {
    const parsed = JSON.parse(content);
    return { left: parsed.left ?? '', right: parsed.right ?? '' };
  } catch {
    return { left: '', right: '' };
  }
}

interface BlockEditorProps {
  block: PageBlock;
  isFirst?: boolean;
  onUpdate: (content: string) => void;
  onDelete: () => void;
  onAddBelow: () => void;
  autoFocus?: boolean;
}

export function BlockEditor({ block, onUpdate, onDelete, onAddBelow, autoFocus }: BlockEditorProps) {
  const [hovered, setHovered] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const renderContent = () => {
    switch (block.type) {
      case 'text':
        return (
          <RichTextEditor
            content={block.content}
            onChange={onUpdate}
            minHeight="80px"
            autoFocus={autoFocus}
          />
        );

      case 'heading':
        return (
          <input
            type="text"
            value={block.content}
            onChange={e => onUpdate(e.target.value)}
            placeholder="Überschrift..."
            autoFocus={autoFocus}
            className="w-full bg-transparent text-2xl font-display font-bold text-gray-100 placeholder-gray-600 outline-none border-none"
          />
        );

      case 'columns': {
        const cols = parseColumns(block.content);
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 rounded-lg border border-white/[0.06] p-2">
              <RichTextEditor
                content={cols.left}
                onChange={v => onUpdate(JSON.stringify({ ...cols, left: v }))}
                minHeight="80px"
                placeholder="Linke Spalte..."
              />
            </div>
            <div className="min-w-0 rounded-lg border border-white/[0.06] p-2">
              <RichTextEditor
                content={cols.right}
                onChange={v => onUpdate(JSON.stringify({ ...cols, right: v }))}
                minHeight="80px"
                placeholder="Rechte Spalte..."
              />
            </div>
          </div>
        );
      }

      case 'drawing':
        return (
          <div className="flex flex-col gap-2">
            {drawingOpen ? (
              <div className="rounded-xl overflow-hidden border border-gray-700">
                <DrawingCanvas
                  initialDataUrl={block.content || undefined}
                  onSave={(dataUrl) => {
                    onUpdate(dataUrl);
                    setDrawingOpen(false);
                  }}
                  onCancel={() => setDrawingOpen(false)}
                />
              </div>
            ) : block.content ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={block.content}
                  alt="Zeichnung"
                  className="w-full max-h-64 object-contain bg-gray-900"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    onClick={() => setDrawingOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/90 text-gray-200 rounded-lg text-sm border border-white/10 hover:bg-gray-700"
                  >
                    <Pencil size={13} /> Bearbeiten
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setDrawingOpen(true)}
                className="flex flex-col items-center justify-center gap-2 py-10 rounded-lg border-2 border-dashed border-gray-700 hover:border-accent-500/60 hover:bg-accent-500/5 transition-colors"
              >
                <Pencil size={24} className="text-gray-600" />
                <span className="text-sm text-gray-500">Zeichnen starten</span>
              </button>
            )}
          </div>
        );

      case 'image':
        return (
          <ImageUpload
            value={block.content || null}
            onChange={(val) => onUpdate(val ?? '')}
            label=""
          />
        );

      case 'divider':
        return <hr className="border-t border-gray-700 my-2" />;

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group"
    >
      {/* Block row */}
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'mt-2 p-1 rounded text-gray-600 cursor-grab active:cursor-grabbing transition-opacity flex-shrink-0',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
        >
          <GripVertical size={15} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'mt-2 p-1 rounded text-gray-600 hover:text-red-400 hover:bg-gray-700 transition-all flex-shrink-0',
            hovered ? 'opacity-100' : 'opacity-0',
          )}
          title="Block löschen"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Add block below (appears on hover between blocks) */}
      <div
        className={cn(
          'absolute -bottom-3 left-8 right-8 flex items-center justify-center z-10 transition-opacity',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          type="button"
          onClick={onAddBelow}
          className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-500 hover:text-accent-400 hover:border-accent-500/50 transition-colors shadow-sm"
        >
          <Plus size={11} />
          <span>Block</span>
        </button>
      </div>
    </div>
  );
}

// Compact icon strip for adding block type
interface AddBlockMenuProps {
  onAdd: (type: PageBlock['type']) => void;
  onClose: () => void;
}

export function AddBlockMenu({ onAdd, onClose }: AddBlockMenuProps) {
  const options: { type: PageBlock['type']; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Text', icon: <span className="text-xs font-bold">T</span> },
    { type: 'heading', label: 'Überschrift', icon: <span className="text-xs font-bold">H</span> },
    { type: 'columns', label: '2 Spalten', icon: <Columns2 size={13} /> },
    { type: 'drawing', label: 'Zeichnung', icon: <Pencil size={13} /> },
    { type: 'image', label: 'Bild', icon: <ImageIcon size={13} /> },
    { type: 'divider', label: 'Trennlinie', icon: <span className="text-lg leading-none">—</span> },
  ];

  return (
    <div className="absolute bottom-full left-0 mb-2 z-20 bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[160px]">
      {options.map(opt => (
        <button
          key={opt.type}
          type="button"
          onClick={() => { onAdd(opt.type); onClose(); }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-gray-100 hover:bg-gray-700 transition-colors text-left"
        >
          <span className="w-5 h-5 flex items-center justify-center text-gray-400">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}
