import { dialog } from 'electron';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { Attachment } from '@notebook/shared';
import type { VaultService } from './vault.service';
import { ATTACHMENTS_DIR } from '../fs/vault-fs';
import { AttachmentsRepository } from '../repositories/attachments.repository';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.zip': 'application/zip',
  '.json': 'application/json',
  '.csv': 'text/csv',
};

export class AttachmentsService {
  constructor(private readonly vault: VaultService) {}

  /** Opens a native file picker and copies the chosen file into the vault's attachments/ folder. Returns null if cancelled. */
  async pickAndAdd(noteId: string): Promise<Attachment | null> {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });
    const [sourcePath] = result.filePaths;
    if (result.canceled || !sourcePath) return null;

    const { rootPath, db } = this.vault.getSession();
    const ext = extname(sourcePath);
    const originalFilename = basename(sourcePath);
    // A short random prefix avoids collisions between attachments that share a filename,
    // without nesting attachments into date-based subfolders.
    const storedFilename = `${uuidv4().slice(0, 8)}-${originalFilename}`;
    const relativePath = `${ATTACHMENTS_DIR}/${storedFilename}`;

    mkdirSync(join(rootPath, ATTACHMENTS_DIR), { recursive: true });
    copyFileSync(sourcePath, join(rootPath, relativePath));
    const { size } = statSync(join(rootPath, relativePath));

    const attachment: Attachment = {
      id: uuidv4(),
      noteId,
      relativePath,
      originalFilename,
      mimeType: MIME_BY_EXT[ext.toLowerCase()] ?? null,
      sizeBytes: size,
      createdAt: new Date().toISOString(),
    };
    new AttachmentsRepository(db).insert(attachment);
    return attachment;
  }
}
