import { useVaultStore } from '../../stores/vault-store';

export function SearchBar() {
  const searchQuery = useVaultStore((s) => s.searchQuery);
  const runSearch = useVaultStore((s) => s.runSearch);
  const clearSearch = useVaultStore((s) => s.clearSearch);

  return (
    <div className="relative p-2">
      <input
        value={searchQuery}
        onChange={(e) => void runSearch(e.target.value)}
        placeholder="Buscar en tus notas…"
        className="w-full rounded border border-brand-200 bg-white px-2 py-1 text-sm text-ink outline-none focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      />
      {searchQuery && (
        <button
          type="button"
          onClick={clearSearch}
          title="Limpiar búsqueda"
          className="absolute right-3 top-3.5 text-xs text-muted hover:text-red-600 dark:text-muted-dark"
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * The snippet from search.repository.ts wraps matches in \x01/\x02 control
 * characters rather than HTML tags — split on those here and render real
 * <mark> elements, instead of dangerouslySetInnerHTML, since the
 * non-matched text is the user's own note content and must never be parsed
 * as markup.
 */
function HighlightedSnippet({ snippet }: { snippet: string }) {
  const parts = snippet.split(/[\x01\x02]/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-accent-100 not-italic text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function SearchResultsList() {
  const results = useVaultStore((s) => s.searchResults);
  const searching = useVaultStore((s) => s.searching);
  const openNote = useVaultStore((s) => s.openNote);

  if (searching) return <p className="p-2 text-sm text-muted dark:text-muted-dark">Buscando…</p>;
  if (results.length === 0) return <p className="p-2 text-sm text-muted dark:text-muted-dark">Sin resultados.</p>;

  return (
    <div className="flex flex-col gap-1 p-1">
      {results.map((result) => (
        <button
          key={result.noteId}
          type="button"
          onClick={() => void openNote(result.noteId)}
          className="rounded p-2 text-left hover:bg-brand-50 dark:hover:bg-slate-800"
        >
          <p className="truncate text-sm font-medium text-ink dark:text-slate-100">{result.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted dark:text-muted-dark">
            <HighlightedSnippet snippet={result.snippet} />
          </p>
        </button>
      ))}
    </div>
  );
}
