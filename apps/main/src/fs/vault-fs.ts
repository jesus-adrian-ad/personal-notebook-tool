import { mkdirSync, existsSync, readFileSync, writeFileSync, rmSync, renameSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import type { VaultTreeNode } from '@notebook/shared';

export const NOTEBOOK_DIR = '.notebook';
export const ATTACHMENTS_DIR = 'attachments';

/** Creates the vault's fixed layout: `.notebook/` (index DB + per-note SQL scratch, git-ignored) and `attachments/`. */
export function ensureVaultStructure(rootPath: string): void {
  mkdirSync(rootPath, { recursive: true });
  mkdirSync(join(rootPath, NOTEBOOK_DIR, 'sql'), { recursive: true });
  mkdirSync(join(rootPath, ATTACHMENTS_DIR), { recursive: true });

  const gitignorePath = join(rootPath, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, `${NOTEBOOK_DIR}/\n`, 'utf-8');
  }
}

export function readNoteFile(rootPath: string, relativePath: string): string {
  return readFileSync(join(rootPath, relativePath), 'utf-8');
}

export function writeNoteFile(rootPath: string, relativePath: string, raw: string): void {
  const fullPath = join(rootPath, relativePath);
  mkdirSync(dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, raw, 'utf-8');
}

export function noteFileExists(rootPath: string, relativePath: string): boolean {
  return existsSync(join(rootPath, relativePath));
}

export function deleteNoteFile(rootPath: string, relativePath: string): void {
  rmSync(join(rootPath, relativePath), { force: true });
}

export function moveNoteFile(rootPath: string, fromRelative: string, toRelative: string): void {
  const from = join(rootPath, fromRelative);
  const to = join(rootPath, toRelative);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
}

export function contentHash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function titleFromFilename(relativePath: string): string {
  return basename(relativePath, extname(relativePath));
}

/** Strips path separators and other filesystem-unsafe characters from a user-typed note or folder name. */
export function sanitizeSegment(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : 'sin-nombre';
}

export function createFolder(rootPath: string, relativePath: string): void {
  mkdirSync(join(rootPath, relativePath), { recursive: true });
}

/** Refuses to delete a non-empty folder — the caller must remove its notes/subfolders first. */
export function deleteFolderIfEmpty(rootPath: string, relativePath: string): void {
  const fullPath = join(rootPath, relativePath);
  if (readdirSync(fullPath).length > 0) {
    throw new Error('La carpeta no está vacía. Elimina o mueve su contenido primero.');
  }
  rmSync(fullPath, { recursive: true });
}

/**
 * Renames a folder in place. Refuses to overwrite an existing target — a
 * collision would silently merge folders on most platforms. Callers are
 * responsible for updating the notes index afterwards (paths under the folder
 * change with it).
 */
export function renameFolder(rootPath: string, fromRelative: string, toRelative: string): void {
  const from = join(rootPath, fromRelative);
  const to = join(rootPath, toRelative);
  if (existsSync(to)) {
    throw new Error(`Ya existe una carpeta llamada "${basename(toRelative)}" en este nivel.`);
  }
  renameSync(from, to);
}

const IGNORED_TOP_LEVEL = new Set([NOTEBOOK_DIR, ATTACHMENTS_DIR, '.git']);

/**
 * Walks the vault directory for its folder/note tree. Note ids are left
 * empty here — the fs layer has no DB access — and are filled in by
 * vault.service from the notes index (path -> id) so this stays a pure
 * filesystem read usable even before the DB is opened (e.g. first rescan).
 */
export function listVaultTree(rootPath: string): VaultTreeNode[] {
  function walk(dir: string, relBase: string): VaultTreeNode[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    const nodes: VaultTreeNode[] = [];
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      if (relBase === '' && IGNORED_TOP_LEVEL.has(entry.name)) continue;

      const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        nodes.push({
          type: 'folder',
          name: entry.name,
          path: relPath,
          children: walk(join(dir, entry.name), relPath),
        });
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        nodes.push({ type: 'note', name: entry.name, path: relPath, noteId: '' });
      }
    }
    return nodes.sort((a, b) => a.name.localeCompare(b.name));
  }
  return walk(rootPath, '');
}
