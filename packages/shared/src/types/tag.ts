export interface Tag {
  id: number;
  name: string;
  noteCount: number;
}

export interface SearchResult {
  noteId: string;
  path: string;
  title: string;
  snippet: string;
  score: number;
}
