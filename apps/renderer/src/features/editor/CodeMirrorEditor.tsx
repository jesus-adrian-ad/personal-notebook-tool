import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Imperative surface used by features that live outside the text editor but
 * need to change its content in place: attachments/URL insertion (at the
 * cursor) and the visual table editor in the preview pane (replacing the
 * exact source range of one table). Both go through CodeMirror rather than
 * the `value` prop so the editor stays the single source of truth — see the
 * note on the mount effect below.
 */
export interface CodeMirrorEditorHandle {
  insertAtCursor: (text: string) => void;
  replaceRange: (from: number, to: number, text: string) => void;
}

export const CodeMirrorEditor = forwardRef<CodeMirrorEditorHandle, Props>(function CodeMirrorEditor(
  { value, onChange },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useImperativeHandle(ref, () => ({
    insertAtCursor: (text) => {
      const view = viewRef.current;
      if (!view) return;
      const { from, to } = view.state.selection.main;
      view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + text.length } });
      view.focus();
    },
    replaceRange: (from, to, text) => {
      const view = viewRef.current;
      if (!view) return;
      view.dispatch({ changes: { from, to, insert: text } });
    },
  }));

  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ codeLanguages: languages }),
        // Deliberately plain: no syntax coloring and no highlightActiveLine()
        // while typing — the user wants a flat white editor and reserves
        // syntax-colored code for the read-only preview pane instead.
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) onChangeRef.current(update.state.doc.toString());
        }),
        // Dark-only editor: explicit background/foreground the caret can
        // contrast against, plus CodeMirror's darkTheme facet so selection
        // and the "cursor at click position" rendering use dark-friendly tints
        // (its base theme switches from the default black caret otherwise).
        EditorView.darkTheme.of(true),
        EditorView.theme({
          '&': { height: '100%', fontSize: '14px', backgroundColor: '#101820', color: '#e2e8f0' },
          '.cm-scroller': { fontFamily: 'ui-monospace, monospace', overflow: 'auto' },
          '.cm-gutters': { backgroundColor: '#101820', color: '#9FB3BF', border: 'none' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => view.destroy();
    // Intentionally only re-created when the editor is mounted; note switches
    // remount this component (see SplitView key={activeNote.id}) so `value`
    // is not a live dependency here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} className="h-full overflow-auto" />;
});
