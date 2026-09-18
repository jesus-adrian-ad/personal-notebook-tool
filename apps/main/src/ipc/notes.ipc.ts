import { ipcMain } from 'electron';
import { z } from 'zod';
import type { NotesService } from '../services/notes.service';

const createSchema = z.object({
  folderPath: z.string(),
  title: z.string().min(1),
  initialBody: z.string().optional(),
});
const getSchema = z.object({ id: z.string() });
const updateSchema = z.object({ id: z.string(), body: z.string() });
const renameSchema = z.object({ id: z.string(), newPath: z.string().min(1) });
const deleteSchema = z.object({ id: z.string() });
const setTagsSchema = z.object({ noteId: z.string(), tags: z.array(z.string()) });

export function registerNotesIpc(notesService: NotesService): void {
  ipcMain.handle('notes:create', async (_event, req) => notesService.create(createSchema.parse(req)));
  ipcMain.handle('notes:get', async (_event, req) => notesService.get(getSchema.parse(req).id));
  ipcMain.handle('notes:update', async (_event, req) => notesService.update(updateSchema.parse(req)));
  ipcMain.handle('notes:rename', async (_event, req) => notesService.rename(renameSchema.parse(req)));
  ipcMain.handle('notes:delete', async (_event, req) => {
    notesService.delete(deleteSchema.parse(req).id);
  });
  ipcMain.handle('notes:list', async () => notesService.list());
  ipcMain.handle('tags:setForNote', async (_event, req) => {
    const { noteId, tags } = setTagsSchema.parse(req);
    return notesService.setTags(noteId, tags);
  });
}
