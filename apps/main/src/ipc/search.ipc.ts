import { ipcMain } from 'electron';
import { z } from 'zod';
import type { VaultService } from '../services/vault.service';

const querySchema = z.object({ text: z.string(), limit: z.number().int().positive().optional() });

export function registerSearchIpc(vault: VaultService): void {
  ipcMain.handle('search:query', async (_event, req) => {
    const { text, limit } = querySchema.parse(req);
    return vault.getSession().search.query(text, limit);
  });

  ipcMain.handle('tags:list', async () => vault.getSession().notes.listAllTags());
}
