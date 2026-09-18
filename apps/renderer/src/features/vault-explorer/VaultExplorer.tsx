import { useState } from 'react';
import type { VaultTreeFile, VaultTreeFolder, VaultTreeNode } from '@notebook/shared';
import { useVaultStore } from '../../stores/vault-store';
import { SearchBar, SearchResultsList } from '../search/SearchBar';

type CreateMode = 'note' | 'folder';

function InlineCreateInput({
  depth,
  mode,
  folderPath,
  onDone,
}: {
  depth: number;
  mode: CreateMode;
  folderPath: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState('');
  const createNote = useVaultStore((s) => s.createNote);
  const createFolder = useVaultStore((s) => s.createFolder);
  const style = { paddingLeft: `${depth * 14 + 8}px` };

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      if (mode === 'note') void createNote(folderPath, trimmed);
      else void createFolder(folderPath, trimmed);
    }
    onDone();
  };

  return (
    <div style={style} className="pr-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') onDone();
        }}
        placeholder={mode === 'note' ? 'Título de la nota…' : 'Nombre de la carpeta…'}
        className="mb-1 w-full rounded border border-brand-300 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
    </div>
  );
}

function NoteNode({ node, depth }: { node: VaultTreeFile; depth: number }) {
  const openNote = useVaultStore((s) => s.openNote);
  const deleteNote = useVaultStore((s) => s.deleteNote);
  const activeNoteId = useVaultStore((s) => s.activeNote?.id);
  const [confirming, setConfirming] = useState(false);
  const style = { paddingLeft: `${depth * 14 + 8}px` };
  const title = node.name.replace(/\.md$/, '');

  if (confirming) {
    return (
      <div style={style} className="flex items-center gap-2 py-1 pr-2 text-xs">
        <span className="truncate text-muted dark:text-muted-dark">¿Eliminar “{title}”?</span>
        <button
          type="button"
          onClick={() => {
            if (node.noteId) void deleteNote(node.noteId);
            setConfirming(false);
          }}
          className="rounded bg-red-600 px-1.5 py-0.5 font-semibold text-white hover:bg-red-700"
        >
          Sí
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded px-1.5 py-0.5 text-muted hover:bg-brand-50 dark:text-muted-dark dark:hover:bg-slate-800"
        >
          No
        </button>
      </div>
    );
  }

  const isActive = node.noteId === activeNoteId;
  return (
    <div style={style} className="group flex items-center pr-1">
      <button
        type="button"
        onClick={() => node.noteId && openNote(node.noteId)}
        className={`block flex-1 truncate rounded py-1 text-left text-sm transition ${
          isActive
            ? 'bg-brand-100 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
            : 'text-ink hover:bg-brand-50 dark:text-slate-300 dark:hover:bg-slate-800'
        }`}
      >
        {title}
      </button>
      <button
        type="button"
        title="Eliminar nota"
        onClick={() => setConfirming(true)}
        className="hidden shrink-0 rounded px-1.5 text-xs text-muted hover:bg-red-50 hover:text-red-600 group-hover:block dark:text-muted-dark dark:hover:bg-slate-800"
      >
        🗑
      </button>
    </div>
  );
}

function FolderNode({ node, depth }: { node: VaultTreeFolder; depth: number }) {
  const deleteFolder = useVaultStore((s) => s.deleteFolder);
  const [creating, setCreating] = useState<CreateMode | null>(null);
  const style = { paddingLeft: `${depth * 14 + 8}px` };

  return (
    <div>
      <div style={style} className="group flex items-center justify-between py-1 pr-1">
        <span className="truncate text-sm font-medium text-muted dark:text-muted-dark">📁 {node.name}</span>
        <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            title="Nueva nota en esta carpeta"
            onClick={() => setCreating('note')}
            className="rounded px-1 text-xs text-muted hover:bg-accent-50 hover:text-accent-700 dark:text-muted-dark dark:hover:bg-slate-800"
          >
            📝+
          </button>
          <button
            type="button"
            title="Nueva subcarpeta"
            onClick={() => setCreating('folder')}
            className="rounded px-1 text-xs text-muted hover:bg-accent-50 hover:text-accent-700 dark:text-muted-dark dark:hover:bg-slate-800"
          >
            📁+
          </button>
          <button
            type="button"
            title="Eliminar carpeta (debe estar vacía)"
            onClick={() => void deleteFolder(node.path)}
            className="rounded px-1 text-xs text-muted hover:bg-red-50 hover:text-red-600 dark:text-muted-dark dark:hover:bg-slate-800"
          >
            🗑
          </button>
        </span>
      </div>
      {creating && (
        <InlineCreateInput depth={depth + 1} mode={creating} folderPath={node.path} onDone={() => setCreating(null)} />
      )}
      {node.children.map((child) => (
        <TreeNode key={child.path} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

function TreeNode({ node, depth }: { node: VaultTreeNode; depth: number }) {
  return node.type === 'folder' ? (
    <FolderNode node={node} depth={depth} />
  ) : (
    <NoteNode node={node} depth={depth} />
  );
}

export function VaultExplorer() {
  const tree = useVaultStore((s) => s.tree);
  const error = useVaultStore((s) => s.error);
  const searchQuery = useVaultStore((s) => s.searchQuery);
  const [creating, setCreating] = useState<CreateMode | null>(null);

  return (
    <div className="flex h-full flex-col border-r border-brand-100 bg-brand-50/40 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center justify-between border-b border-brand-100 p-2 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-widest text-accent-700 dark:text-accent-400">
          Notas
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setCreating('folder')}
            className="rounded-md border border-accent-600 px-2 py-1 text-xs font-bold text-accent-700 hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-slate-800"
          >
            + Carpeta
          </button>
          <button
            type="button"
            onClick={() => setCreating('note')}
            className="rounded-md bg-accent-600 px-2 py-1 text-xs font-bold text-white hover:bg-accent-700"
          >
            + Nota
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-start justify-between gap-2 border-b border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          <span>{error}</span>
        </div>
      )}
      <SearchBar />
      <div className="flex-1 overflow-y-auto p-1">
        {searchQuery ? (
          <SearchResultsList />
        ) : (
          <>
            {creating && <InlineCreateInput depth={0} mode={creating} folderPath="" onDone={() => setCreating(null)} />}
            {tree.length === 0 && !creating ? (
              <p className="p-2 text-sm text-muted dark:text-muted-dark">Sin notas todavía.</p>
            ) : (
              tree.map((node) => <TreeNode key={node.path} node={node} depth={0} />)
            )}
          </>
        )}
      </div>
    </div>
  );
}
