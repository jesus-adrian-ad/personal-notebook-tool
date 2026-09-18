import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import type { RecentVault } from '@notebook/shared';

interface AppSettingsFile {
  recentVaults: RecentVault[];
}

const MAX_RECENTS = 8;

/**
 * App-level settings (which vaults exist, which was opened last) live
 * outside any vault, in Electron's userData dir — a vault's own SQLite index
 * only knows about itself, and the app needs to know about vaults before it
 * opens any of them (including on first launch, before one exists).
 */
export class AppSettingsService {
  private readonly filePath = join(app.getPath('userData'), 'app-settings.json');

  private read(): AppSettingsFile {
    if (!existsSync(this.filePath)) return { recentVaults: [] };
    try {
      return JSON.parse(readFileSync(this.filePath, 'utf-8')) as AppSettingsFile;
    } catch {
      return { recentVaults: [] };
    }
  }

  private write(data: AppSettingsFile): void {
    mkdirSync(app.getPath('userData'), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  getRecents(): RecentVault[] {
    return this.read().recentVaults;
  }

  getMostRecent(): RecentVault | null {
    return this.read().recentVaults[0] ?? null;
  }

  recordOpened(rootPath: string): RecentVault[] {
    const data = this.read();
    const withoutCurrent = data.recentVaults.filter((v) => v.rootPath !== rootPath);
    const entry: RecentVault = { rootPath, name: basename(rootPath), lastOpenedAt: new Date().toISOString() };
    data.recentVaults = [entry, ...withoutCurrent].slice(0, MAX_RECENTS);
    this.write(data);
    return data.recentVaults;
  }

  removeRecent(rootPath: string): RecentVault[] {
    const data = this.read();
    data.recentVaults = data.recentVaults.filter((v) => v.rootPath !== rootPath);
    this.write(data);
    return data.recentVaults;
  }
}
