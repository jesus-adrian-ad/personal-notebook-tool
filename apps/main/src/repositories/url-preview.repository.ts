import type Database from 'better-sqlite3';
import type { UrlPreview } from '@notebook/shared';

interface UrlPreviewRow {
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  favicon_cached_path: string | null;
  fetched_at: string;
  fetch_error: string | null;
}

function toUrlPreview(row: UrlPreviewRow): UrlPreview {
  return {
    url: row.url,
    title: row.title,
    description: row.description,
    faviconUrl: row.favicon_url,
    faviconCachedPath: row.favicon_cached_path,
    fetchedAt: row.fetched_at,
    fetchError: row.fetch_error,
  };
}

export class UrlPreviewRepository {
  constructor(private readonly db: Database.Database) {}

  get(url: string): UrlPreview | null {
    const row = this.db.prepare('SELECT * FROM url_previews WHERE url = ?').get(url) as UrlPreviewRow | undefined;
    return row ? toUrlPreview(row) : null;
  }

  upsert(preview: UrlPreview): void {
    this.db
      .prepare(
        `INSERT INTO url_previews (url, title, description, favicon_url, favicon_cached_path, fetched_at, fetch_error)
         VALUES (@url, @title, @description, @faviconUrl, @faviconCachedPath, @fetchedAt, @fetchError)
         ON CONFLICT(url) DO UPDATE SET
           title = excluded.title,
           description = excluded.description,
           favicon_url = excluded.favicon_url,
           favicon_cached_path = excluded.favicon_cached_path,
           fetched_at = excluded.fetched_at,
           fetch_error = excluded.fetch_error`,
      )
      .run(preview);
  }
}
