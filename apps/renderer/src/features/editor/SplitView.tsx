import { useEffect, useRef, useState } from 'react';
import type { Note } from '@notebook/shared';
import { CodeMirrorEditor, type CodeMirrorEditorHandle } from './CodeMirrorEditor';
import { MarkdownPreview } from './MarkdownPreview';
import { TagEditor } from '../tags/TagEditor';
import { useVaultStore } from '../../stores/vault-store';

const SAVE_DEBOUNCE_MS = 800;

function UrlInsertInput({ onDone, onInsert }: { onDone: () => void; onInsert: (url: string) => void }) {
  const [value, setValue] = useState('');

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed) onInsert(trimmed);
    onDone();
  };

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={submit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') onDone();
      }}
      placeholder="https://…"
      className="w-56 rounded border border-brand-300 bg-white px-2 py-1 text-xs text-ink outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    />
  );
}

function NoteEditor({ note }: { note: Note }) {
  const [body, setBody] = useState(note.body);
  const [insertingUrl, setInsertingUrl] = useState(false);
  const saveActiveNoteBody = useVaultStore((s) => s.saveActiveNoteBody);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const editorRef = useRef<CodeMirrorEditorHandle>(null);

  const handleChange = (next: string) => {
    setBody(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void saveActiveNoteBody(next), SAVE_DEBOUNCE_MS);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleTableEdit = (startOffset: number, endOffset: number, markdown: string) => {
    editorRef.current?.replaceRange(startOffset, endOffset, markdown);
  };

  const handleAttach = async () => {
    const attachment = await window.notebookApi.attachments.add(note.id);
    if (!attachment) return;
    const isImage = attachment.mimeType?.startsWith('image/');
    const label = isImage ? '!' : '';
    editorRef.current?.insertAtCursor(`${label}[${attachment.originalFilename}](${attachment.relativePath})\n`);
  };

  const handleInsertUrl = (url: string) => {
    editorRef.current?.insertAtCursor(`\n${url}\n`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-brand-100 bg-white px-3 py-1.5 dark:border-slate-800 dark:bg-slate-900">
        <TagEditor note={note} />
        <div className="flex shrink-0 items-center gap-2">
          {insertingUrl ? (
            <UrlInsertInput onDone={() => setInsertingUrl(false)} onInsert={handleInsertUrl} />
          ) : (
            <button
              type="button"
              onClick={() => setInsertingUrl(true)}
              className="rounded px-2 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-slate-800"
            >
              🔗 URL
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleAttach()}
            className="rounded px-2 py-1 text-xs font-semibold text-accent-700 hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-slate-800"
          >
            📎 Adjuntar
          </button>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-[minmax(0,1fr)] overflow-hidden">
        <div className="min-h-0 overflow-hidden border-r border-brand-100 dark:border-slate-800">
          <CodeMirrorEditor ref={editorRef} value={body} onChange={handleChange} />
        </div>
        <div className="min-h-0 overflow-hidden">
          <MarkdownPreview source={body} onTableEdit={handleTableEdit} />
        </div>
      </div>
    </div>
  );
}

export function SplitView() {
  const activeNote = useVaultStore((s) => s.activeNote);

  if (!activeNote) {
    return (
      <div className="flex h-full items-center justify-center text-muted dark:text-muted-dark">
        Selecciona o crea una nota para empezar a escribir.
      </div>
    );
  }

  // Remount on note switch so CodeMirror re-initializes with the new doc.
  return <NoteEditor key={activeNote.id} note={activeNote} />;
}
