import type Database from 'better-sqlite3';
import type { Attachment } from '@notebook/shared';

export class AttachmentsRepository {
  constructor(private readonly db: Database.Database) {}

  insert(attachment: Attachment): void {
    this.db
      .prepare(
        `INSERT INTO attachments (id, note_id, relative_path, original_filename, mime_type, size_bytes, created_at)
         VALUES (@id, @noteId, @relativePath, @originalFilename, @mimeType, @sizeBytes, @createdAt)`,
      )
      .run(attachment);
  }
}
