import { ipcMain, dialog } from 'electron';
import { z } from 'zod';
import type { VaultService } from '../services/vault.service';
import type { AppSettingsService } from '../services/app-settings.service';

const openSchema = z.object({ rootPath: z.string().optional() });
const removeRecentSchema = z.object({ rootPath: z.string() });
const createFolderSchema = z.object({ parentPath: z.string(), name: z.string().min(1) });
const renameFolderSchema = z.object({ path: z.string(), newName: z.string().trim().min(1) });
const deleteFolderSchema = z.object({ path: z.string() });

export function registerVaultIpc(vault: VaultService, appSettings: AppSettingsService): void {
  ipcMain.handle('vault:open', async (_event, req) => {
    const { rootPath } = openSchema.parse(req ?? {});
    let resolvedPath = rootPath;
    if (!resolvedPath) {
      const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
      const [firstPath] = result.filePaths;
      if (result.canceled || !firstPath) {
        throw new Error('Vault selection cancelled');
      }
      resolvedPath = firstPath;
    }
    const info = vault.open(resolvedPath);
    appSettings.recordOpened(resolvedPath);
    return info;
  });

  ipcMain.handle('vault:getTree', async () => vault.getTree());

  ipcMain.handle('vault:getInfo', async () => vault.getInfo());

  ipcMain.handle('vault:getRecents', async () => appSettings.getRecents());

  ipcMain.handle('vault:removeRecent', async (_event, req) => {
    const { rootPath } = removeRecentSchema.parse(req);
    return appSettings.removeRecent(rootPath);
  });

  ipcMain.handle('vault:createFolder', async (_event, req) => {
    const { parentPath, name } = createFolderSchema.parse(req);
    vault.createFolder(parentPath, name);
  });

  ipcMain.handle('vault:renameFolder', async (_event, req) => {
    const { path, newName } = renameFolderSchema.parse(req);
    vault.renameFolder(path, newName);
  });

  ipcMain.handle('vault:deleteFolder', async (_event, req) => {
    const { path } = deleteFolderSchema.parse(req);
    vault.deleteFolder(path);
  });
}
