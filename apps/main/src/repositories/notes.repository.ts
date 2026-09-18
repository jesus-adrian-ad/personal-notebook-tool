import type Database from 'better-sqlite3';

export interface NoteRow {
  id: string;
  path: string;
  title: string;
  created_at: string;
  updated_at: string;
  content_hash: string;
  frontmatter_json: string | null;
  size_bytes: number;
  deleted_at: string | null;
}

export interface UpsertNoteInput {
  id: string;
  path: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  contentHash: string;
  frontmatterJson: string;
  sizeBytes: number;
}

export class NotesRepository {
  constructor(private readonly db: Database.Database) {}

  upsertNote(input: UpsertNoteInput): void {
    this.db
      .prepare(
        `INSERT INTO notes (id, path, title, created_at, updated_at, content_hash, frontmatter_json, size_bytes, deleted_at)
         VALUES (@id, @path, @title, @createdAt, @updatedAt, @contentHash, @frontmatterJson, @sizeBytes, NULL)
         ON CONFLICT(id) DO UPDATE SET
           path = excluded.path,
           title = excluded.title,
           updated_at = excluded.updated_at,
           content_hash = excluded.content_hash,
           frontmatter_json = excluded.frontmatter_json,
           size_bytes = excluded.size_bytes,
           deleted_at = NULL`,
      )
      .run(input);
  }

  setBody(noteId: string, body: string): void {
    this.db
      .prepare(
        `INSERT INTO note_body (note_id, body) VALUES (?, ?)
         ON CONFLICT(note_id) DO UPDATE SET body = excluded.body`,
      )
      .run(noteId, body);
  }

  getBody(noteId: string): string {
    const row = this.db.prepare('SELECT body FROM note_body WHERE note_id = ?').get(noteId) as
      | { body: string }
      | undefined;
    return row?.body ?? '';
  }

  getById(id: string): NoteRow | undefined {
    return this.db.prepare('SELECT * FROM notes WHERE id = ? AND deleted_at IS NULL').get(id) as
      | NoteRow
      | undefined;
  }

  getByPath(path: string): NoteRow | undefined {
    return this.db.prepare('SELECT * FROM notes WHERE path = ? AND deleted_at IS NULL').get(path) as
      | NoteRow
      | undefined;
  }

  list(): NoteRow[] {
    return this.db.prepare('SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY path').all() as NoteRow[];
  }

  /** Path -> id map used to enrich a filesystem-derived tree with ids without re-reading every file. */
  pathToIdMap(): Map<string, string> {
    const rows = this.db.prepare('SELECT id, path FROM notes WHERE deleted_at IS NULL').all() as {
      id: string;
      path: string;
    }[];
    return new Map(rows.map((r) => [r.path, r.id]));
  }

  softDelete(id: string): void {
    this.db.prepare('UPDATE notes SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), id);
  }

  setTags(noteId: string, tagNames: string[]): void {
    const insertTag = this.db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    const getTagId = this.db.prepare('SELECT id FROM tags WHERE name = ?');
    const clearTags = this.db.prepare('DELETE FROM note_tags WHERE note_id = ?');
    const linkTag = this.db.prepare('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)');

    const tx = this.db.transaction((names: string[]) => {
      clearTags.run(noteId);
      for (const raw of names) {
        const name = raw.trim().toLowerCase();
        if (!name) continue;
        insertTag.run(name);
        const { id: tagId } = getTagId.get(name) as { id: number };
        linkTag.run(noteId, tagId);
      }
    });
    tx(tagNames);
  }

  getTags(noteId: string): string[] {
    const rows = this.db
      .prepare(
        `SELECT t.name FROM tags t
         JOIN note_tags nt ON nt.tag_id = t.id
         WHERE nt.note_id = ? ORDER BY t.name`,
      )
      .all(noteId) as { name: string }[];
    return rows.map((r) => r.name);
  }

  listAllTags(): { id: number; name: string; noteCount: number }[] {
    return this.db
      .prepare(
        `SELECT t.id, t.name, COUNT(nt.note_id) as noteCount
         FROM tags t LEFT JOIN note_tags nt ON nt.tag_id = t.id
         GROUP BY t.id ORDER BY t.name`,
      )
      .all() as { id: number; name: string; noteCount: number }[];
  }
}
