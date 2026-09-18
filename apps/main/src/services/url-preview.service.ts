import ogs from 'open-graph-scraper';
import type { UrlPreview } from '@notebook/shared';
import type { VaultService } from './vault.service';
import { UrlPreviewRepository } from '../repositories/url-preview.repository';

/** Fetches title/description/favicon for a URL pasted into a note, cached forever per vault (no TTL — personal notes rarely need a refetch). */
export class UrlPreviewService {
  constructor(private readonly vault: VaultService) {}

  async get(url: string): Promise<UrlPreview> {
    const { db } = this.vault.getSession();
    const repo = new UrlPreviewRepository(db);
    const cached = repo.get(url);
    if (cached) return cached;

    const fetchedAt = new Date().toISOString();
    try {
      const { result } = await ogs({ url, timeout: 8000 });
      const preview: UrlPreview = {
        url,
        title: result.ogTitle ?? result.twitterTitle ?? null,
        description: result.ogDescription ?? null,
        faviconUrl: result.favicon ? new URL(result.favicon, url).toString() : null,
        faviconCachedPath: null,
        fetchedAt,
        fetchError: null,
      };
      repo.upsert(preview);
      return preview;
    } catch (err) {
      const preview: UrlPreview = {
        url,
        title: null,
        description: null,
        faviconUrl: null,
        faviconCachedPath: null,
        fetchedAt,
        fetchError: err instanceof Error ? err.message : String(err),
      };
      repo.upsert(preview);
      return preview;
    }
  }
}
