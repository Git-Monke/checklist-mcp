PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    list_id INTEGER NOT NULL,
    parent_id INTEGER,

    text TEXT NOT NULL,
    checked BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES list_items(id) ON DELETE CASCADE
);