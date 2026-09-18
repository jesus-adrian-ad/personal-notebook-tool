import { ipcMain } from 'electron';
import { z } from 'zod';
import type { UrlPreviewService } from '../services/url-preview.service';

const getSchema = z.object({ url: z.string() });

export function registerUrlPreviewIpc(service: UrlPreviewService): void {
  ipcMain.handle('urlPreview:get', async (_event, req) => {
    const { url } = getSchema.parse(req);
    return service.get(url);
  });
}
