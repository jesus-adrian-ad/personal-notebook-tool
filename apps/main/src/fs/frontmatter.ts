import matter from 'gray-matter';
import { v4 as uuidv4 } from 'uuid';

export interface ParsedNote {
  id: string;
  frontmatter: Record<string, unknown>;
  tags: string[];
  body: string;
}

/**
 * `id` and `tags` are first-class frontmatter keys we manage ourselves; any
 * other frontmatter the user (or another tool) writes is preserved verbatim
 * in `frontmatter` and round-tripped on the next save.
 */
export function parseNoteFile(raw: string): ParsedNote {
  const { data, content } = matter(raw);
  const { id: rawId, tags: rawTags, ...rest } = data as Record<string, unknown>;
  const id = typeof rawId === 'string' ? rawId : uuidv4();
  const tags = Array.isArray(rawTags) ? rawTags.filter((t): t is string => typeof t === 'string') : [];
  return { id, frontmatter: rest, tags, body: content.replace(/^\n+/, '') };
}

export function serializeNoteFile(note: Pick<ParsedNote, 'id' | 'tags' | 'frontmatter' | 'body'>): string {
  return matter.stringify(note.body, { id: note.id, tags: note.tags, ...note.frontmatter });
}
