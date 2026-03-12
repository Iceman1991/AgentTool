import { mergeAttributes } from '@tiptap/core';
import Mention from '@tiptap/extension-mention';
import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { useEntityStore } from '../../stores/entityStore';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

// ── Suggestion List Component ──────────────────────────────────────────────

interface SuggestionItem {
  id: string;
  name: string;
  typeName: string;
  typeColor: string;
}

interface SuggestionListProps {
  items: SuggestionItem[];
  command: (item: { id: string; label: string }) => void;
}

interface SuggestionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) {
        command({ id: item.id, label: item.name });
      }
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(i => (i + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex(i => (i + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="mention-dropdown">
          <div className="mention-item" style={{ color: '#8A8070', cursor: 'default' }}>
            Keine Entitäten gefunden
          </div>
        </div>
      );
    }

    return (
      <div className="mention-dropdown">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            className={`mention-item${index === selectedIndex ? ' is-selected' : ''}`}
            onClick={() => selectItem(index)}
          >
            <span
              className="mention-dot"
              style={{ backgroundColor: item.typeColor }}
            />
            <span className="mention-name">{item.name}</span>
            <span className="mention-type">{item.typeName}</span>
          </button>
        ))}
      </div>
    );
  }
);
SuggestionList.displayName = 'SuggestionList';

// ── Mention Extension factory ──────────────────────────────────────────────

export function buildEntityMentionExtension() {
  return Mention.configure({
    HTMLAttributes: {
      class: 'entity-mention',
    },
    renderHTML({ options, node }) {
      return [
        'a',
        mergeAttributes(
          { href: `/entities/${node.attrs.id}`, 'data-entity-id': node.attrs.id },
          options.HTMLAttributes,
        ),
        `@${node.attrs.label ?? node.attrs.id}`,
      ];
    },
    suggestion: {
      char: '@',
      allowSpaces: false,

      items: ({ query }: { query: string }) => {
        const entities = useEntityStore.getState().entities;
        const entityTypes = useEntityTypeStore.getState().entityTypes;
        const typeMap = new Map(entityTypes.map(et => [et.id, et]));

        return entities
          .filter(e => e.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
          .map(e => {
            const et = typeMap.get(e.typeId);
            return {
              id: e.id,
              name: e.name,
              typeName: et?.name || 'Unbekannt',
              typeColor: et?.color || '#6B7280',
            };
          });
      },

      render: () => {
        let component: ReactRenderer<SuggestionListRef> | null = null;
        let popup: TippyInstance[] | null = null;

        return {
          onStart: (props) => {
            component = new ReactRenderer(SuggestionList, {
              props,
              editor: props.editor,
            });

            if (!props.clientRect) return;

            popup = tippy('body', {
              getReferenceClientRect: props.clientRect as () => DOMRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              theme: 'mention',
            });
          },

          onUpdate: (props) => {
            component?.updateProps(props);
            if (!props.clientRect) return;
            popup?.[0]?.setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          },

          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              popup?.[0]?.hide();
              return true;
            }
            return component?.ref?.onKeyDown(props) ?? false;
          },

          onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
            popup = null;
            component = null;
          },
        };
      },
    },
  });
}

// Static instance used by RichTextEditor (created once, reused)
export const EntityMentionExtension = buildEntityMentionExtension();
