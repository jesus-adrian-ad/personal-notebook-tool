import type Database from 'better-sqlite3';
import type { SearchResult } from '@notebook/shared';

export class SearchRepository {
  constructor(private readonly db: Database.Database) {}

  query(text: string, limit = 50): SearchResult[] {
    const match = text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((term) => `${term.replace(/"/g, '""')}*`)
      .join(' ');
    if (!match) return [];

    // char(1)/char(2) are control-character markers, never real HTML tags,
    // so the renderer can split and highlight matches itself instead of
    // using dangerouslySetInnerHTML — the snippet's non-matched text is the
    // user's own note content and must never be interpreted as markup.
    const rows = this.db
      .prepare(
        `SELECT n.id as noteId, n.path as path, n.title as title,
                snippet(notes_fts, 2, char(1), char(2), '…', 12) as snippet,
                bm25(notes_fts) as score
         FROM notes_fts
         JOIN notes n ON n.id = notes_fts.note_id
         WHERE notes_fts MATCH ? AND n.deleted_at IS NULL
         ORDER BY score
         LIMIT ?`,
      )
      .all(match, limit) as { noteId: string; path: string; title: string; snippet: string; score: number }[];

    return rows;
  }
}
