import { join, basename } from 'node:path';
import type Database from 'better-sqlite3';
import type { VaultInfo, VaultTreeNode } from '@notebook/shared';
import { openVaultDatabase } from '../repositories/db';
import { NotesRepository } from '../repositories/notes.repository';
import { SearchRepository } from '../repositories/search.repository';
import {
  createFolder,
  deleteFolderIfEmpty,
  ensureVaultStructure,
  listVaultTree,
  NOTEBOOK_DIR,
  sanitizeSegment,
} from '../fs/vault-fs';

export interface VaultSession {
  rootPath: string;
  db: Database.Database;
  notes: NotesRepository;
  search: SearchRepository;
}

/**
 * Owns the single currently-open vault for this app instance (one-user,
 * one-vault-at-a-time desktop app — no need for a session map). Opening a
 * vault ensures its on-disk layout and SQLite index exist, then hands out
 * the shared session other services depend on.
 */
export class VaultService {
  private session: VaultSession | null = null;

  open(rootPath: string): VaultInfo {
    if (this.session && this.session.rootPath === rootPath) {
      return this.getInfo()!;
    }
    this.session?.db.close();

    ensureVaultStructure(rootPath);
    const db = openVaultDatabase(join(rootPath, NOTEBOOK_DIR, 'notebook.db'));
    this.session = {
      rootPath,
      db,
      notes: new NotesRepository(db),
      search: new SearchRepository(db),
    };
    return this.getInfo()!;
  }

  getSession(): VaultSession {
    if (!this.session) throw new Error('No vault is open. Call vault:open first.');
    return this.session;
  }

  getInfo(): VaultInfo | null {
    if (!this.session) return null;
    return {
      rootPath: this.session.rootPath,
      name: basename(this.session.rootPath),
      noteCount: this.session.notes.list().length,
      gitEnabled: true,
    };
  }

  getTree(): VaultTreeNode[] {
    const session = this.getSession();
    const idByPath = session.notes.pathToIdMap();

    function enrich(nodes: VaultTreeNode[]): VaultTreeNode[] {
      return nodes.map((node) =>
        node.type === 'folder'
          ? { ...node, children: enrich(node.children) }
          : { ...node, noteId: idByPath.get(node.path) ?? '' },
      );
    }

    return enrich(listVaultTree(session.rootPath));
  }

  createFolder(parentPath: string, name: string): void {
    const { rootPath } = this.getSession();
    const relativePath = parentPath ? join(parentPath, sanitizeSegment(name)) : sanitizeSegment(name);
    createFolder(rootPath, relativePath);
  }

  deleteFolder(path: string): void {
    const { rootPath } = this.getSession();
    deleteFolderIfEmpty(rootPath, path);
  }
}
