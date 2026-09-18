import { create } from 'zustand';
import type { Note, RecentVault, SearchResult, Tag, VaultInfo, VaultTreeNode } from '@notebook/shared';

interface VaultState {
  vaultInfo: VaultInfo | null;
  recents: RecentVault[];
  tree: VaultTreeNode[];
  activeNote: Note | null;
  allTags: Tag[];
  searchQuery: string;
  searchResults: SearchResult[];
  searching: boolean;
  /** True once the startup auto-open attempt (or its absence) has resolved, so the launcher doesn't flash before it. */
  initialized: boolean;
  loading: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  openVaultPicker: () => Promise<void>;
  openVaultByPath: (rootPath: string) => Promise<void>;
  forgetRecent: (rootPath: string) => Promise<void>;
  closeVault: () => void;
  refreshTree: () => Promise<void>;
  loadTags: () => Promise<void>;
  runSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
  openNote: (id: string) => Promise<void>;
  saveActiveNoteBody: (body: string) => Promise<void>;
  createNote: (folderPath: string, title: string) => Promise<void>;
  renameNote: (id: string, newTitle: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  clearError: () => void;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  renameFolder: (path: string, newName: string) => Promise<void>;
  deleteFolder: (path: string) => Promise<void>;
  setTagsForActiveNote: (tags: string[]) => Promise<void>;
}

/** ipcRenderer.invoke wraps main-process errors as "Error invoking remote method '<channel>': Error: <msg>" — show only <msg>. */
function errorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/^Error invoking remote method '[^']+': (?:Error: )?/, '');
}

async function loadOpenedVault(set: (partial: Partial<VaultState>) => void, rootPath?: string) {
  const info = await window.notebookApi.vault.open(rootPath);
  const tree = await window.notebookApi.vault.getTree();
  const allTags = await window.notebookApi.tags.list();
  set({ vaultInfo: info, tree, allTags, loading: false, error: null });
}

export const useVaultStore = create<VaultState>((set, get) => ({
  vaultInfo: null,
  recents: [],
  tree: [],
  activeNote: null,
  allTags: [],
  searchQuery: '',
  searchResults: [],
  searching: false,
  initialized: false,
  loading: false,
  error: null,

  initialize: async () => {
    const recents = await window.notebookApi.vault.getRecents();
    set({ recents });

    const mostRecent = recents[0];
    if (!mostRecent) {
      set({ initialized: true });
      return;
    }

    try {
      await loadOpenedVault(set, mostRecent.rootPath);
    } catch {
      const remaining = await window.notebookApi.vault.removeRecent(mostRecent.rootPath);
      set({ recents: remaining });
    } finally {
      set({ initialized: true });
    }
  },

  openVaultPicker: async () => {
    set({ loading: true, error: null });
    try {
      await loadOpenedVault(set);
      set({ recents: await window.notebookApi.vault.getRecents() });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  openVaultByPath: async (rootPath) => {
    set({ loading: true, error: null });
    try {
      await loadOpenedVault(set, rootPath);
      set({ recents: await window.notebookApi.vault.getRecents() });
    } catch (err) {
      const remaining = await window.notebookApi.vault.removeRecent(rootPath);
      set({ loading: false, recents: remaining, error: 'No se pudo abrir ese vault (¿se movió o se borró la carpeta?).' });
    }
  },

  forgetRecent: async (rootPath) => {
    const remaining = await window.notebookApi.vault.removeRecent(rootPath);
    set({ recents: remaining });
  },

  closeVault: () => set({ vaultInfo: null, tree: [], activeNote: null }),

  refreshTree: async () => {
    const tree = await window.notebookApi.vault.getTree();
    set({ tree });
    await get().loadTags();
  },

  loadTags: async () => {
    const allTags = await window.notebookApi.tags.list();
    set({ allTags });
  },

  runSearch: async (query) => {
    set({ searchQuery: query, searching: true });
    if (!query.trim()) {
      set({ searchResults: [], searching: false });
      return;
    }
    const results = await window.notebookApi.search.query(query);
    if (get().searchQuery === query) set({ searchResults: results, searching: false });
  },

  clearSearch: () => set({ searchQuery: '', searchResults: [], searching: false }),

  openNote: async (id) => {
    const note = await window.notebookApi.notes.get(id);
    set({ activeNote: note });
  },

  saveActiveNoteBody: async (body) => {
    const active = get().activeNote;
    if (!active) return;
    const summary = await window.notebookApi.notes.update({ id: active.id, body });
    set({ activeNote: { ...active, ...summary, body } });
  },

  createNote: async (folderPath, title) => {
    set({ error: null });
    try {
      const note = await window.notebookApi.notes.create({ folderPath, title });
      await get().refreshTree();
      set({ activeNote: note });
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },

  renameNote: async (id, newTitle) => {
    set({ error: null });
    try {
      const summary = await window.notebookApi.notes.rename({ id, newTitle });
      const active = get().activeNote;
      if (active?.id === id) set({ activeNote: { ...active, ...summary } });
      await get().refreshTree();
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },

  clearError: () => set({ error: null }),

  deleteNote: async (id) => {
    await window.notebookApi.notes.delete(id);
    if (get().activeNote?.id === id) set({ activeNote: null });
    await get().refreshTree();
  },

  createFolder: async (parentPath, name) => {
    set({ error: null });
    try {
      await window.notebookApi.vault.createFolder(parentPath, name);
      await get().refreshTree();
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },

  deleteFolder: async (path) => {
    set({ error: null });
    try {
      await window.notebookApi.vault.deleteFolder(path);
      await get().refreshTree();
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },

  renameFolder: async (path, newName) => {
    set({ error: null });
    try {
      await window.notebookApi.vault.renameFolder(path, newName);
      await get().refreshTree();
    } catch (err) {
      set({ error: errorMessage(err) });
    }
  },

  setTagsForActiveNote: async (tags) => {
    const active = get().activeNote;
    if (!active) return;
    const summary = await window.notebookApi.tags.setForNote(active.id, tags);
    set({ activeNote: { ...active, ...summary } });
    await get().loadTags();
  },
}));
