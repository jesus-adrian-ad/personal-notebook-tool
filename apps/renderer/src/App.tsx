import { useEffect } from 'react';
import { VaultExplorer } from './features/vault-explorer/VaultExplorer';
import { SplitView } from './features/editor/SplitView';
import { Launcher } from './features/launcher/Launcher';
import { useVaultStore } from './stores/vault-store';
import { useTheme } from './theme/useTheme';

export function App() {
  const vaultInfo = useVaultStore((s) => s.vaultInfo);
  const initialized = useVaultStore((s) => s.initialized);
  const initialize = useVaultStore((s) => s.initialize);
  const closeVault = useVaultStore((s) => s.closeVault);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper dark:bg-carbon">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!vaultInfo) {
    return <Launcher />;
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-brand-100 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={closeVault}
          title="Cambiar de vault"
          className="rounded px-2 py-1 font-display text-sm font-bold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-slate-800"
        >
          {vaultInfo.name}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded px-2 py-1 text-xs text-muted hover:bg-brand-50 dark:text-muted-dark dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
      </header>
      <div className="grid flex-1 grid-cols-[260px_1fr] overflow-hidden">
        <VaultExplorer />
        <SplitView />
      </div>
    </div>
  );
}
