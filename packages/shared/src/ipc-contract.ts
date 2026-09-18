import type { Attachment, UrlPreview } from './types/attachment';
import type { CommitLogEntry, DiffHunk } from './types/git';
import type { CreateNoteInput, Note, NoteSummary, RenameNoteInput, UpdateNoteInput } from './types/note';
import type { SearchResult, Tag } from './types/tag';
import type { RecentVault, VaultInfo, VaultTreeNode } from './types/vault';

/**
 * Single source of truth for every IPC channel exposed by the preload bridge.
 * Each key is the channel name; `req`/`res` describe the payload/response shape.
 * `ipcMain.handle` in apps/main and `ipcRenderer.invoke` in apps/preload must
 * both be typed against this map so a channel rename or signature change fails
 * to compile on both sides.
 */
export interface IpcContract {
  'vault:open': { req: { rootPath?: string }; res: VaultInfo };
  'vault:getTree': { req: void; res: VaultTreeNode[] };
  'vault:getInfo': { req: void; res: VaultInfo | null };
  'vault:getRecents': { req: void; res: RecentVault[] };
  'vault:removeRecent': { req: { rootPath: string }; res: RecentVault[] };
  'vault:createFolder': { req: { parentPath: string; name: string }; res: void };
  'vault:deleteFolder': { req: { path: string }; res: void };

  'notes:create': { req: CreateNoteInput; res: Note };
  'notes:get': { req: { id: string }; res: Note };
  'notes:update': { req: UpdateNoteInput; res: NoteSummary };
  'notes:rename': { req: RenameNoteInput; res: NoteSummary };
  'notes:delete': { req: { id: string }; res: void };
  'notes:list': { req: void; res: NoteSummary[] };

  'tags:list': { req: void; res: Tag[] };
  'tags:setForNote': { req: { noteId: string; tags: string[] }; res: NoteSummary };

  'search:query': { req: { text: string; limit?: number }; res: SearchResult[] };

  'attachments:add': { req: { noteId: string }; res: Attachment | null };
  'urlPreview:get': { req: { url: string }; res: UrlPreview };

  'git:log': { req: { notePath: string }; res: CommitLogEntry[] };
  'git:diff': { req: { notePath: string; hash: string }; res: DiffHunk[] };
  'git:restore': { req: { notePath: string; hash: string }; res: NoteSummary };

  'export:toPdf': { req: { noteId: string; destPath: string }; res: void };
  'export:toHtml': { req: { noteId: string; destPath: string }; res: void };
}

export type IpcChannel = keyof IpcContract;
export type IpcRequest<C extends IpcChannel> = IpcContract[C]['req'];
export type IpcResponse<C extends IpcChannel> = IpcContract[C]['res'];
