import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { NotePage, PageBlock } from '../../types';
import { useNotePageStore } from '../../stores/notePageStore';
import { cn } from '../../lib/utils';

function parseColumns(content: string): { left: string; right: string } {
  try {
    const parsed = JSON.parse(content);
    return { left: parsed.left ?? '', right: parsed.right ?? '' };
  } catch {
    return { left: '', right: '' };
  }
}

function BlockView({ block }: { block: PageBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <div
          className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content) }}
        />
      );

    case 'columns': {
      const cols = parseColumns(block.content);
      return (
        <div className="grid grid-cols-2 gap-4">
          <div
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cols.left) }}
          />
          <div
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(cols.right) }}
          />
        </div>
      );
    }

    case 'heading':
      return (
        <h2 className="font-display text-2xl font-bold text-gray-100 leading-tight">
          {block.content || <span className="text-gray-600 italic">Leere Überschrift</span>}
        </h2>
      );

    case 'drawing':
      return block.content ? (
        <div className="rounded-xl overflow-hidden border border-white/[0.07] bg-gray-800/40">
          <img
            src={block.content}
            alt="Zeichnung"
            className="w-full object-contain max-h-[600px] bg-gray-950"
          />
        </div>
      ) : null;

    case 'image':
      return block.content ? (
        <div className="rounded-xl overflow-hidden border border-white/[0.07]">
          <img
            src={block.content}
            alt="Bild"
            className="w-full object-cover max-h-[600px]"
          />
        </div>
      ) : null;

    case 'divider':
      return <hr className="border-white/[0.08] my-2" />;

    default:
      return null;
  }
}

interface NotePageViewerProps {
  page: NotePage;
}

export function NotePageViewer({ page }: NotePageViewerProps) {
  const navigate = useNavigate();
  const { notePages } = useNotePageStore();
  const childPages = notePages.filter(p => p.parentId === page.id);
  const blocks = [...page.blocks].sort((a, b) => a.order - b.order);
  const visibleBlocks = blocks.filter(b => b.content || b.type === 'divider');

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-4xl leading-none select-none">{page.icon}</span>
        <h1 className="flex-1 text-3xl font-display font-bold text-gray-100 leading-tight mt-1">
          {page.title || <span className="text-gray-600 italic">Unbenannte Seite</span>}
        </h1>
      </div>

      {/* Blocks */}
      {visibleBlocks.length === 0 ? (
        <p className="text-gray-600 italic text-sm">Diese Seite hat noch keinen Inhalt.</p>
      ) : (
        <div className="flex flex-col gap-5">
          {visibleBlocks.map(block => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>
      )}

      {/* Subpages */}
      {childPages.length > 0 && (
        <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-white/[0.06]">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Unterseiten</h3>
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
        </div>
      )}
    </div>
  );
}
