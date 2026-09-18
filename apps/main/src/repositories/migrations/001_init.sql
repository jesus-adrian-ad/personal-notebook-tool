CREATE TABLE vault_meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  frontmatter_json TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);
CREATE INDEX idx_notes_path ON notes(path);
CREATE INDEX idx_notes_updated ON notes(updated_at);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);
CREATE INDEX idx_note_tags_tag ON note_tags(tag_id);

CREATE TABLE note_body (
  note_id TEXT PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  body TEXT NOT NULL
);

CREATE VIRTUAL TABLE notes_fts USING fts5(
  note_id UNINDEXED,
  title,
  body,
  tokenize = 'porter unicode61'
);

CREATE TRIGGER note_body_ai AFTER INSERT ON note_body BEGIN
  INSERT INTO notes_fts(note_id, title, body)
  VALUES (
    new.note_id,
    (SELECT title FROM notes WHERE id = new.note_id),
    new.body
  );
END;

CREATE TRIGGER note_body_ad AFTER DELETE ON note_body BEGIN
  DELETE FROM notes_fts WHERE note_id = old.note_id;
END;

CREATE TRIGGER note_body_au AFTER UPDATE ON note_body BEGIN
  DELETE FROM notes_fts WHERE note_id = old.note_id;
  INSERT INTO notes_fts(note_id, title, body)
  VALUES (
    new.note_id,
    (SELECT title FROM notes WHERE id = new.note_id),
    new.body
  );
END;

CREATE TRIGGER notes_title_au AFTER UPDATE OF title ON notes BEGIN
  DELETE FROM notes_fts WHERE note_id = old.id;
  INSERT INTO notes_fts(note_id, title, body)
  SELECT new.id, new.title, COALESCE((SELECT body FROM note_body WHERE note_id = new.id), '');
END;

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
  relative_path TEXT NOT NULL,
  original_filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE url_previews (
  url TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  favicon_url TEXT,
  favicon_cached_path TEXT,
  fetched_at TEXT NOT NULL,
  fetch_error TEXT
);
