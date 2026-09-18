import { ipcMain } from 'electron';
import { z } from 'zod';
import type { AttachmentsService } from '../services/attachments.service';

const addSchema = z.object({ noteId: z.string() });

export function registerAttachmentsIpc(attachments: AttachmentsService): void {
  ipcMain.handle('attachments:add', async (_event, req) => {
    const { noteId } = addSchema.parse(req);
    return attachments.pickAndAdd(noteId);
  });
}
