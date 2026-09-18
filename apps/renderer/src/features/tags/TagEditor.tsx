import { useState } from 'react';
import type { Note } from '@notebook/shared';
import { useVaultStore } from '../../stores/vault-store';

export function TagEditor({ note }: { note: Note }) {
  const setTagsForActiveNote = useVaultStore((s) => s.setTagsForActiveNote);
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const name = draft.trim().toLowerCase();
    setDraft('');
    if (!name || note.tags.includes(name)) return;
    void setTagsForActiveNote([...note.tags, name]);
  };

  const removeTag = (tag: string) => {
    void setTagsForActiveNote(note.tags.filter((t) => t !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {note.tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-slate-800 dark:text-accent-400"
        >
          #{tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            title="Quitar tag"
            className="text-accent-700/60 hover:text-red-600 dark:text-accent-400/60"
          >
            ✕
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') addTag();
        }}
        placeholder="+ tag"
        className="w-20 border-b border-transparent bg-transparent px-1 py-0.5 text-xs text-muted outline-none focus:border-accent-400 dark:text-muted-dark"
      />
    </div>
  );
}
