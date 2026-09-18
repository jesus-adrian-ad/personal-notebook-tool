import { dirname, join } from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import type { CreateNoteInput, Note, NoteSummary, RenameNoteInput, UpdateNoteInput } from '@notebook/shared';
import type { VaultService } from './vault.service';
import { parseNoteFile, serializeNoteFile } from '../fs/frontmatter';
import {
  contentHash,
  deleteNoteFile,
  moveNoteFile,
  noteFileExists,
  readNoteFile,
  sanitizeSegment,
  titleFromFilename,
  writeNoteFile,
} from '../fs/vault-fs';
import type { NoteRow } from '../repositories/notes.repository';

/**
 * writeFileSync/renameSync silently replace an existing file, so without this
 * check a note created or renamed onto an existing title would destroy the
 * other note's content on disk before the DB's UNIQUE(path) even complained.
 */
function assertNoteNameFree(rootPath: string, relativePath: string): void {
  if (noteFileExists(rootPath, relativePath)) {
    throw new Error(`Ya existe una nota llamada "${titleFromFilename(relativePath)}" en esta carpeta.`);
  }
}

export class NotesService {
  constructor(private readonly vault: VaultService) {}

  private toSummary(row: NoteRow): NoteSummary {
    const { notes } = this.vault.getSession();
    return {
      id: row.id,
      path: row.path,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      sizeBytes: row.size_bytes,
      tags: notes.getTags(row.id),
    };
  }

  create(input: CreateNoteInput): Note {
    const { rootPath, notes } = this.vault.getSession();
    const filename = `${sanitizeSegment(input.title)}.md`;
    const relativePath = input.folderPath ? join(input.folderPath, filename) : filename;
    assertNoteNameFree(rootPath, relativePath);

    const id = uuidv4();
    const body = input.initialBody ?? '';
    const raw = serializeNoteFile({ id, tags: [], frontmatter: {}, body });
    writeNoteFile(rootPath, relativePath, raw);

    const now = new Date().toISOString();
    notes.upsertNote({
      id,
      path: relativePath,
      title: titleFromFilename(relativePath),
      createdAt: now,
      updatedAt: now,
      contentHash: contentHash(raw),
      frontmatterJson: '{}',
      sizeBytes: Buffer.byteLength(raw, 'utf-8'),
    });
    notes.setBody(id, body);
    notes.setTags(id, []);

    return this.get(id);
  }

  get(id: string): Note {
    const { rootPath, notes } = this.vault.getSession();
    const row = notes.getById(id);
    if (!row) throw new Error(`Note not found: ${id}`);

    const raw = readNoteFile(rootPath, row.path);
    const parsed = parseNoteFile(raw);

    const hash = contentHash(raw);
    if (hash !== row.content_hash) {
      // Disk drifted from the index (external edit) — reconcile before returning.
      notes.upsertNote({
        id: row.id,
        path: row.path,
        title: titleFromFilename(row.path),
        createdAt: row.created_at,
        updatedAt: new Date().toISOString(),
        contentHash: hash,
        frontmatterJson: JSON.stringify(parsed.frontmatter),
        sizeBytes: Buffer.byteLength(raw, 'utf-8'),
      });
      notes.setBody(row.id, parsed.body);
      notes.setTags(row.id, parsed.tags);
    }

    return {
      ...this.toSummary(notes.getById(id)!),
      body: parsed.body,
      frontmatter: parsed.frontmatter,
    };
  }

  update(input: UpdateNoteInput): NoteSummary {
    const { rootPath, notes } = this.vault.getSession();
    const row = notes.getById(input.id);
    if (!row) throw new Error(`Note not found: ${input.id}`);

    const existing = parseNoteFile(readNoteFile(rootPath, row.path));
    const raw = serializeNoteFile({
      id: row.id,
      tags: existing.tags,
      frontmatter: existing.frontmatter,
      body: input.body,
    });
    writeNoteFile(rootPath, row.path, raw);

    notes.upsertNote({
      id: row.id,
      path: row.path,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: new Date().toISOString(),
      contentHash: contentHash(raw),
      frontmatterJson: JSON.stringify(existing.frontmatter),
      sizeBytes: Buffer.byteLength(raw, 'utf-8'),
    });
    notes.setBody(row.id, input.body);

    return this.toSummary(notes.getById(row.id)!);
  }

  rename(input: RenameNoteInput): NoteSummary {
    const { rootPath, notes } = this.vault.getSession();
    const row = notes.getById(input.id);
    if (!row) throw new Error(`Note not found: ${input.id}`);

    const folder = dirname(row.path);
    const filename = `${sanitizeSegment(input.newTitle)}.md`;
    const newPath = folder === '.' ? filename : join(folder, filename);
    if (newPath === row.path) return this.toSummary(row);
    assertNoteNameFree(rootPath, newPath);

    moveNoteFile(rootPath, row.path, newPath);
    notes.upsertNote({
      id: row.id,
      path: newPath,
      title: titleFromFilename(newPath),
      createdAt: row.created_at,
      updatedAt: new Date().toISOString(),
      contentHash: row.content_hash,
      frontmatterJson: row.frontmatter_json ?? '{}',
      sizeBytes: row.size_bytes,
    });

    return this.toSummary(notes.getById(row.id)!);
  }

  delete(id: string): void {
    const { rootPath, notes } = this.vault.getSession();
    const row = notes.getById(id);
    if (!row) return;
    deleteNoteFile(rootPath, row.path);
    notes.softDelete(id);
  }

  list(): NoteSummary[] {
    const { notes } = this.vault.getSession();
    return notes.list().map((row) => this.toSummary(row));
  }

  setTags(noteId: string, tags: string[]): NoteSummary {
    const { rootPath, notes } = this.vault.getSession();
    const row = notes.getById(noteId);
    if (!row) throw new Error(`Note not found: ${noteId}`);

    const existing = parseNoteFile(readNoteFile(rootPath, row.path));
    const raw = serializeNoteFile({ id: row.id, tags, frontmatter: existing.frontmatter, body: existing.body });
    writeNoteFile(rootPath, row.path, raw);

    notes.setTags(noteId, tags);
    notes.upsertNote({
      id: row.id,
      path: row.path,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: new Date().toISOString(),
      contentHash: contentHash(raw),
      frontmatterJson: row.frontmatter_json ?? '{}',
      sizeBytes: Buffer.byteLength(raw, 'utf-8'),
    });

    return this.toSummary(notes.getById(noteId)!);
  }
}
