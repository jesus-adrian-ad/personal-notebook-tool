import { useVaultStore } from '../../stores/vault-store';

function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString();
}

export function Launcher() {
  const recents = useVaultStore((s) => s.recents);
  const loading = useVaultStore((s) => s.loading);
  const error = useVaultStore((s) => s.error);
  const openVaultPicker = useVaultStore((s) => s.openVaultPicker);
  const openVaultByPath = useVaultStore((s) => s.openVaultByPath);
  const forgetRecent = useVaultStore((s) => s.forgetRecent);

  const hasRecents = recents.length > 0;

  return (
    <div className="h-screen overflow-y-auto bg-paper dark:bg-carbon">
      <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-brand-600 dark:text-brand-300">
          Personal Notebook
        </h1>
        <p className="mt-1 text-sm text-muted dark:text-muted-dark">
          {hasRecents ? 'Continúa donde lo dejaste' : 'Tus notas, tu código, tus tablas — todo en un solo lugar'}
        </p>
      </div>

      {hasRecents && (
        <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
          {recents.map((vault) => (
            <button
              key={vault.rootPath}
              type="button"
              onClick={() => void openVaultByPath(vault.rootPath)}
              className="group relative rounded-lg border border-brand-200 bg-white p-4 text-left shadow-sm transition hover:border-brand-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  void forgetRecent(vault.rootPath);
                }}
                title="Olvidar este vault"
                className="absolute right-2 top-2 hidden rounded px-1.5 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 group-hover:block dark:hover:bg-slate-800"
              >
                ✕
              </span>
              <p className="truncate font-medium text-ink dark:text-slate-100">{vault.name}</p>
              <p className="mt-0.5 truncate text-xs text-muted dark:text-muted-dark">{vault.rootPath}</p>
              <p className="mt-2 text-xs font-semibold text-accent-700 dark:text-accent-400">
                Abierto {formatRelativeDate(vault.lastOpenedAt)}
              </p>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() => void openVaultPicker()}
        className="rounded-lg bg-accent-600 px-5 py-2.5 font-bold text-white shadow-sm transition hover:bg-accent-700 disabled:opacity-60"
      >
        {loading ? 'Abriendo…' : hasRecents ? '+ Nuevo vault' : 'Crear mi primer vault'}
      </button>

      {error && <p className="max-w-md text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
