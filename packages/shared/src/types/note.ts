export interface NoteSummary {
  id: string;
  path: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
  tags: string[];
}

export interface Note extends NoteSummary {
  body: string;
  frontmatter: Record<string, unknown>;
}

export interface CreateNoteInput {
  /** Folder path relative to the vault root, empty string for vault root. */
  folderPath: string;
  title: string;
  initialBody?: string;
}

export interface UpdateNoteInput {
  id: string;
  body: string;
}

/** Renames in place: the note stays in its folder, only its title/filename changes. */
export interface RenameNoteInput {
  id: string;
  newTitle: string;
}
