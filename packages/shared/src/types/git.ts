export interface CommitLogEntry {
  hash: string;
  shortHash: string;
  message: string;
  date: string;
}

export interface DiffHunk {
  header: string;
  lines: { type: 'add' | 'remove' | 'context'; content: string }[];
}
