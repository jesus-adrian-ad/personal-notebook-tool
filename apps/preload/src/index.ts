import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel, IpcRequest, IpcResponse } from '@notebook/shared';

function invoke<C extends IpcChannel>(channel: C, req: IpcRequest<C>): Promise<IpcResponse<C>> {
  return ipcRenderer.invoke(channel, req);
}

/**
 * The only surface the renderer ever touches — every method is a thin,
 * typed wrapper over one IpcContract channel. contextIsolation stays on and
 * nodeIntegration off (see apps/main/src/window.ts), so this is the sole
 * bridge between untrusted renderer code and fs/child_process/SQLite in main.
 */
const api = {
  vault: {
    open: (rootPath?: string) => invoke('vault:open', { rootPath }),
    getTree: () => invoke('vault:getTree', undefined),
    getInfo: () => invoke('vault:getInfo', undefined),
    getRecents: () => invoke('vault:getRecents', undefined),
    removeRecent: (rootPath: string) => invoke('vault:removeRecent', { rootPath }),
    createFolder: (parentPath: string, name: string) => invoke('vault:createFolder', { parentPath, name }),
    renameFolder: (path: string, newName: string) => invoke('vault:renameFolder', { path, newName }),
    deleteFolder: (path: string) => invoke('vault:deleteFolder', { path }),
  },
  notes: {
    create: (req: IpcRequest<'notes:create'>) => invoke('notes:create', req),
    get: (id: string) => invoke('notes:get', { id }),
    update: (req: IpcRequest<'notes:update'>) => invoke('notes:update', req),
    rename: (req: IpcRequest<'notes:rename'>) => invoke('notes:rename', req),
    delete: (id: string) => invoke('notes:delete', { id }),
    list: () => invoke('notes:list', undefined),
  },
  tags: {
    list: () => invoke('tags:list', undefined),
    setForNote: (noteId: string, tags: string[]) => invoke('tags:setForNote', { noteId, tags }),
  },
  search: {
    query: (text: string, limit?: number) => invoke('search:query', { text, limit }),
  },
  attachments: {
    add: (noteId: string) => invoke('attachments:add', { noteId }),
  },
  urlPreview: {
    get: (url: string) => invoke('urlPreview:get', { url }),
  },
};

export type NotebookApi = typeof api;

contextBridge.exposeInMainWorld('notebookApi', api);
