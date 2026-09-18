export interface VaultInfo {
  rootPath: string;
  name: string;
  noteCount: number;
  gitEnabled: boolean;
}

export interface RecentVault {
  rootPath: string;
  name: string;
  lastOpenedAt: string;
}

export interface VaultTreeFolder {
  type: 'folder';
  name: string;
  path: string;
  children: VaultTreeNode[];
}

export interface VaultTreeFile {
  type: 'note';
  name: string;
  path: string;
  noteId: string;
}

export type VaultTreeNode = VaultTreeFolder | VaultTreeFile;
