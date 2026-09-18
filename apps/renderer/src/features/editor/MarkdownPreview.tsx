import { useEffect, useMemo, useState } from 'react';
import { parseMarkdownToHast } from '@notebook/markdown-engine';
import {
  renderHastToReact,
  type MarkdownComponents,
  type CodeBlockProps,
  type MarkdownTableProps,
  type UrlEmbedProps,
} from '@notebook/markdown-engine/react';
import type { TableModel } from '@notebook/markdown-engine';
import type { UrlPreview } from '@notebook/shared';
import { TableEditor } from '../table-editor/TableEditor';
import hljs from 'highlight.js/lib/common';

/**
 * Only the read-only preview gets colored syntax — the editor itself stays
 * plain white while typing (deliberate: the user wants a flat typing
 * surface and reserves highlighting for the finished, rendered block).
 * highlight.js escapes the source itself before wrapping tokens in its own
 * `hljs-*` spans, so injecting its output is the standard safe pattern.
 */
function highlightCode(code: string, language: string): string {
  if (language !== 'texto' && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value;
  }
  return hljs.highlightAuto(code).value;
}

/** Documentation-only: any language string is just a label, there is no execution. */
function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-brand-200 dark:border-slate-700">
      <div className="flex items-center justify-between bg-brand-50 px-2 py-1 text-xs dark:bg-slate-800">
        <span className="font-mono text-brand-700 dark:text-brand-300">{language}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded px-2 py-0.5 text-muted hover:bg-brand-100 hover:text-brand-700 dark:text-muted-dark dark:hover:bg-slate-700"
        >
          {copied ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>
      <pre className="!my-0 overflow-x-auto p-2 text-sm">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

function UrlEmbedCard({ href }: UrlEmbedProps) {
  const [preview, setPreview] = useState<UrlPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    window.notebookApi.urlPreview.get(href).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="my-2 flex items-center gap-3 rounded-lg border border-brand-100 p-3 transition hover:border-accent-400 dark:border-slate-700"
    >
      {preview?.faviconUrl && (
        <img src={preview.faviconUrl} alt="" className="h-6 w-6 shrink-0 rounded" />
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-accent-700 dark:text-accent-400">
          {preview?.title ?? href}
        </p>
        {preview?.description && (
          <p className="truncate text-xs text-muted dark:text-muted-dark">{preview.description}</p>
        )}
        {!preview?.title && <p className="truncate text-xs text-muted dark:text-muted-dark">{href}</p>}
      </div>
    </a>
  );
}

interface Props {
  source: string;
  onTableEdit: (startOffset: number, endOffset: number, markdown: string) => void;
}

export function MarkdownPreview({ source, onTableEdit }: Props) {
  const tree = useMemo(() => parseMarkdownToHast(source), [source]);

  const components: MarkdownComponents = {
    CodeBlock,

    MarkdownTable: ({ model }: MarkdownTableProps) => (
      <TableEditor model={JSON.parse(model) as TableModel} onCommit={onTableEdit} />
    ),

    UrlEmbed: UrlEmbedCard,
  };

  return <div className="markdown-body h-full overflow-auto p-4">{renderHastToReact(tree, components)}</div>;
}
