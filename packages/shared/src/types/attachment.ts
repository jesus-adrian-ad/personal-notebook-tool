export interface Attachment {
  id: string;
  noteId: string | null;
  relativePath: string;
  originalFilename: string;
  mimeType: string | null;
  sizeBytes: number;
  createdAt: string;
}

export interface UrlPreview {
  url: string;
  title: string | null;
  description: string | null;
  faviconUrl: string | null;
  faviconCachedPath: string | null;
  fetchedAt: string;
  fetchError: string | null;
}
