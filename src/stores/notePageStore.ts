import { create } from 'zustand';
import { db } from '../db';
import { uid } from '../lib/utils';
import type { NotePage, PageBlock, BlockType } from '../types';
import { useWorkspaceStore } from './workspaceStore';

interface NotePageState {
  notePages: NotePage[];
  loading: boolean;
  load: () => Promise<void>;
  createPage: (data?: Partial<NotePage>) => Promise<NotePage>;
  updatePage: (id: string, data: Partial<NotePage>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  hardDeletePage: (id: string) => Promise<void>;
  reorderPages: (orderedIds: string[]) => Promise<void>;
  addBlock: (pageId: string, type: BlockType) => Promise<PageBlock>;
  updateBlock: (pageId: string, blockId: string, content: string) => Promise<void>;
  deleteBlock: (pageId: string, blockId: string) => Promise<void>;
  reorderBlocks: (pageId: string, orderedIds: string[]) => Promise<void>;
  getRootPages: () => NotePage[];
  getChildren: (parentId: string) => NotePage[];
  movePage: (id: string, newParentId: string | null) => Promise<void>;
}

export const useNotePageStore = create<NotePageState>((set, get) => ({
  notePages: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const all = await db.notePages.orderBy('createdAt').toArray();
    set({ notePages: all.filter(p => !p.deletedAt && (!p.workspaceId || p.workspaceId === wsId)), loading: false });
  },

  createPage: async (data = {}) => {
    const now = Date.now();
    const wsId = useWorkspaceStore.getState().currentWorkspaceId;
    const siblings = get().notePages.filter(p =>
      data.parentId !== undefined ? p.parentId === data.parentId : !p.parentId
    );
    const maxOrder = siblings.reduce((max, p) => Math.max(max, p.order ?? 0), -1);
    const newPage: NotePage = {
      id: uid(),
      title: data.title ?? 'Neue Seite',
      icon: data.icon ?? '📄',
      ...(data.parentId !== undefined ? { parentId: data.parentId } : {}),
      order: maxOrder + 1,
      blocks: data.blocks ?? [],
      tags: data.tags ?? [],
      linkedEntityIds: data.linkedEntityIds ?? [],
      workspaceId: wsId,
      createdAt: now,
      updatedAt: now,
    };
    await db.notePages.add(newPage);
    set(state => ({ notePages: [...state.notePages, newPage] }));
    return newPage;
  },

  updatePage: async (id, data) => {
    const updated = { ...data, updatedAt: Date.now() };
    await db.notePages.update(id, updated);
    set(state => ({
      notePages: state.notePages.map(p => p.id === id ? { ...p, ...updated } : p),
    }));
  },

  deletePage: async (id) => {
    const allPages = get().notePages;
    const toDelete: string[] = [];
    const collect = (pageId: string) => {
      toDelete.push(pageId);
      allPages.filter(p => p.parentId === pageId).forEach(child => collect(child.id));
    };
    collect(id);
    const now = Date.now();
    await Promise.all(toDelete.map(pid => db.notePages.update(pid, { deletedAt: now })));
    set(state => ({ notePages: state.notePages.filter(p => !toDelete.includes(p.id)) }));
  },

  hardDeletePage: async (id) => {
    await db.notePages.delete(id);
    set(state => ({ notePages: state.notePages.filter(p => p.id !== id) }));
  },

  reorderPages: async (orderedIds) => {
    const pages = get().notePages;
    const updates: Promise<void>[] = [];
    orderedIds.forEach((pageId, index) => {
      const page = pages.find(p => p.id === pageId);
      if (page && page.order !== index) {
        updates.push(db.notePages.update(pageId, { order: index, updatedAt: Date.now() }).then(() => {}));
      }
    });
    await Promise.all(updates);
    set(state => ({
      notePages: state.notePages.map(p => {
        const idx = orderedIds.indexOf(p.id);
        return idx !== -1 ? { ...p, order: idx } : p;
      }),
    }));
  },

  addBlock: async (pageId, type) => {
    const page = get().notePages.find(p => p.id === pageId);
    if (!page) throw new Error(`Page ${pageId} not found`);
    const maxOrder = page.blocks.reduce((max, b) => Math.max(max, b.order), -1);
    const newBlock: PageBlock = {
      id: uid(),
      type,
      content: '',
      order: maxOrder + 1,
    };
    const updatedBlocks = [...page.blocks, newBlock];
    await db.notePages.update(pageId, { blocks: updatedBlocks, updatedAt: Date.now() });
    set(state => ({
      notePages: state.notePages.map(p =>
        p.id === pageId ? { ...p, blocks: updatedBlocks, updatedAt: Date.now() } : p
      ),
    }));
    return newBlock;
  },

  updateBlock: async (pageId, blockId, content) => {
    const page = get().notePages.find(p => p.id === pageId);
    if (!page) return;
    const updatedBlocks = page.blocks.map(b => b.id === blockId ? { ...b, content } : b);
    await db.notePages.update(pageId, { blocks: updatedBlocks, updatedAt: Date.now() });
    set(state => ({
      notePages: state.notePages.map(p =>
        p.id === pageId ? { ...p, blocks: updatedBlocks, updatedAt: Date.now() } : p
      ),
    }));
  },

  deleteBlock: async (pageId, blockId) => {
    const page = get().notePages.find(p => p.id === pageId);
    if (!page) return;
    const updatedBlocks = page.blocks.filter(b => b.id !== blockId);
    await db.notePages.update(pageId, { blocks: updatedBlocks, updatedAt: Date.now() });
    set(state => ({
      notePages: state.notePages.map(p =>
        p.id === pageId ? { ...p, blocks: updatedBlocks, updatedAt: Date.now() } : p
      ),
    }));
  },

  reorderBlocks: async (pageId, orderedIds) => {
    const page = get().notePages.find(p => p.id === pageId);
    if (!page) return;
    const blockMap = new Map(page.blocks.map(b => [b.id, b]));
    const updatedBlocks = orderedIds
      .map((id, index) => {
        const block = blockMap.get(id);
        return block ? { ...block, order: index } : null;
      })
      .filter((b): b is PageBlock => b !== null);
    await db.notePages.update(pageId, { blocks: updatedBlocks, updatedAt: Date.now() });
    set(state => ({
      notePages: state.notePages.map(p =>
        p.id === pageId ? { ...p, blocks: updatedBlocks, updatedAt: Date.now() } : p
      ),
    }));
  },

  getRootPages: () => {
    return get().notePages.filter(p => !p.parentId);
  },

  getChildren: (parentId) => {
    return get().notePages.filter(p => p.parentId === parentId);
  },

  movePage: async (id, newParentId) => {
    const update: Partial<NotePage> = { updatedAt: Date.now() };
    if (newParentId === null) {
      // Remove parentId by setting to undefined – Dexie stores undefined as missing key
      update.parentId = undefined;
    } else {
      update.parentId = newParentId;
    }
    await db.notePages.update(id, update);
    set(state => ({
      notePages: state.notePages.map(p =>
        p.id === id
          ? { ...p, parentId: newParentId ?? undefined, updatedAt: Date.now() }
          : p
      ),
    }));
  },
}));
