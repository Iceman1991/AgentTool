import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold, Italic, Strikethrough, Code, Link as LinkIcon,
  Heading1, Heading2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Highlighter,
  Undo, Redo,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { buildEntityMentionExtension } from '../forms/EntityMention';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  label?: string;
  placeholder?: string;
  minHeight?: string;
  autoFocus?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'p-1.5 rounded text-sm transition-colors',
        active ? 'bg-accent-500 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <div className="w-px h-5 bg-gray-700 mx-1" />;
}

export function RichTextEditor({ content, onChange, label, minHeight = '150px', autoFocus = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Highlight,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      buildEntityMentionExtension(),
    ],
    autofocus: autoFocus,
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none p-3',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt('URL eingeben:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
      <div className="border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent-500">
        <div className="flex flex-wrap gap-0.5 p-1.5 bg-gray-900 border-b border-gray-700">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Fett">
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Kursiv">
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Durchgestrichen">
            <Strikethrough size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Code">
            <Code size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Markieren">
            <Highlighter size={14} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Überschrift 1">
            <Heading1 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Überschrift 2">
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Liste">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Nummerierte Liste">
            <ListOrdered size={14} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Links">
            <AlignLeft size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Zentriert">
            <AlignCenter size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rechts">
            <AlignRight size={14} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
            <LinkIcon size={14} />
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Rückgängig">
            <Undo size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Wiederholen">
            <Redo size={14} />
          </ToolbarButton>
        </div>
        <div className="bg-gray-800">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
