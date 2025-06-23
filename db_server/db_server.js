import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer } from "ws";

const DB_PATH = "./checklist.db";
const MIGRATION_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "migrations/001.sql"
);
const PORT = 1029;

function startDatabase() {
  try {
    const db = new Database(DB_PATH);
    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync(MIGRATION_PATH, "utf-8");
    db.exec(migrationSQL);
    console.log(
      `✅ Successfully migrated and connected to SQLite database at ${DB_PATH}`
    );
    return db;
  } catch (error) {
    console.error(
      "❌ Failed to connect or migrate SQLite database:",
      error.message
    );
    process.exit(1);
  }
}

const db = startDatabase();
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server and attach Express
const server = http.createServer(app);

// Set up WebSocket server on the same HTTP server
const wss = new WebSocketServer({ server });

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// WebSocket connection logging
wss.on("connection", (ws, req) => {
  console.log(`[WS] Client connected (${req.socket.remoteAddress})`);
  ws.on("close", () => {
    console.log("[WS] Client disconnected");
  });
});

// Broadcast to all clients that lists have changed (general update)
function broadcastListsUpdate() {
  console.log(`[WS] Broadcasting lists_updated to ${wss.clients.size} clients`);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send("lists_updated");
    }
  });
}

// Broadcast to all clients that a specific list has changed
function broadcastListUpdate(listId) {
  console.log(
    `[WS] Broadcasting list_updated:${listId} to ${wss.clients.size} clients`
  );
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(`list_updated:${listId}`);
    }
  });
}

// --- Lists CRUD ---
app.get("/lists", (req, res) => {
  try {
    const lists = db.prepare("SELECT * FROM lists").all();
    console.log(`[DB] Fetched all lists (${lists.length})`);
    res.json(lists);
  } catch (err) {
    console.error("[DB] Failed to fetch lists", err);
    res.status(500).json({ error: "Failed to fetch lists" });
    return;
  }
});

app.post("/lists", (req, res) => {
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "'name' is required" });
    return;
  }
  try {
    const stmt = db.prepare("INSERT INTO lists (name) VALUES (?)");
    const info = stmt.run(name);
    const list = db
      .prepare("SELECT * FROM lists WHERE id = ?")
      .get(info.lastInsertRowid);
    console.log(`[DB] Created list '${name}' (id=${list.id})`);
    res.status(201).json(list);
    broadcastListsUpdate();
  } catch (err) {
    console.error("[DB] Failed to create list", err);
    res.status(500).json({ error: "Failed to create list" });
    return;
  }
});

app.get("/lists/:id", (req, res) => {
  const { id } = req.params;
  try {
    const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    const items = db
      .prepare("SELECT * FROM list_items WHERE list_id = ?")
      .all(id);
    const itemsTree = buildListItemTree(items);
    console.log(`[DB] Fetched list id=${id} with ${items.length} items`);
    res.json({ ...list, items: itemsTree });
  } catch (err) {
    console.error(`[DB] Failed to fetch list id=${id}`, err);
    res.status(500).json({ error: "Failed to fetch list" });
    return;
  }
});

app.put("/lists/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "'name' is required" });
    return;
  }
  try {
    const stmt = db.prepare(
      "UPDATE lists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    const info = stmt.run(name, id);
    if (info.changes === 0) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    const list = db.prepare("SELECT * FROM lists WHERE id = ?").get(id);
    console.log(`[DB] Updated list id=${id} name='${name}'`);
    res.json(list);
    broadcastListsUpdate();
  } catch (err) {
    console.error(`[DB] Failed to update list id=${id}`, err);
    res.status(500).json({ error: "Failed to update list" });
    return;
  }
});

app.delete("/lists/:id", (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare("DELETE FROM lists WHERE id = ?");
    const info = stmt.run(id);
    if (info.changes === 0) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    console.log(`[DB] Deleted list id=${id}`);
    res.json({ success: true });
    broadcastListsUpdate();
  } catch (err) {
    console.error(`[DB] Failed to delete list id=${id}`, err);
    res.status(500).json({ error: "Failed to delete list" });
    return;
  }
});

// --- ListItems CRUD (under /lists/:id/items) ---
app.get("/lists/:id/items", (req, res) => {
  const { id } = req.params;
  try {
    const items = db
      .prepare("SELECT * FROM list_items WHERE list_id = ?")
      .all(id);
    console.log(`[DB] Fetched items for list id=${id} (${items.length} items)`);
    res.json(items);
  } catch (err) {
    console.error(`[DB] Failed to fetch items for list id=${id}`, err);
    res.status(500).json({ error: "Failed to fetch list items" });
    return;
  }
});

app.post("/lists/:id/items", (req, res) => {
  const { id } = req.params;
  const { text, checked = false, parent_id = null } = req.body;
  if (!text) {
    res.status(400).json({ error: "'text' is required" });
    return;
  }
  try {
    const stmt = db.prepare(
      "INSERT INTO list_items (list_id, parent_id, text, checked) VALUES (?, ?, ?, ?)"
    );
    const info = stmt.run(id, parent_id, text, checked ? 1 : 0);
    const item = db
      .prepare("SELECT * FROM list_items WHERE id = ?")
      .get(info.lastInsertRowid);
    console.log(`[DB] Created item id=${item.id} in list id=${id}`);
    res.status(201).json(item);
    broadcastListUpdate(id);
  } catch (err) {
    console.error(`[DB] Failed to create item in list id=${id}`, err);
    res.status(500).json({ error: "Failed to create list item" });
    return;
  }
});

app.get("/lists/:id/items/:itemId", (req, res) => {
  const { id, itemId } = req.params;
  try {
    const item = db
      .prepare("SELECT * FROM list_items WHERE id = ? AND list_id = ?")
      .get(itemId, id);
    if (!item) {
      res.status(404).json({ error: "List item not found" });
      return;
    }
    console.log(`[DB] Fetched item id=${itemId} from list id=${id}`);
    res.json(item);
  } catch (err) {
    console.error(
      `[DB] Failed to fetch item id=${itemId} from list id=${id}`,
      err
    );
    res.status(500).json({ error: "Failed to fetch list item" });
    return;
  }
});

app.put("/lists/:id/items/:itemId", (req, res) => {
  const { id, itemId } = req.params;
  const { text, checked, parent_id } = req.body;
  if (text === undefined && checked === undefined && parent_id === undefined) {
    res.status(400).json({
      error: "At least one of 'text', 'checked', or 'parent_id' is required",
    });
    return;
  }
  try {
    const fields = [];
    const values = [];
    if (text !== undefined) {
      fields.push("text = ?");
      values.push(text);
    }
    if (checked !== undefined) {
      fields.push("checked = ?");
      values.push(checked ? 1 : 0);
    }
    if (parent_id !== undefined) {
      fields.push("parent_id = ?");
      values.push(parent_id);
    }
    values.push(itemId, id);
    const stmt = db.prepare(
      `UPDATE list_items SET ${fields.join(", ")} WHERE id = ? AND list_id = ?`
    );
    const info = stmt.run(...values);
    if (info.changes === 0) {
      res.status(404).json({ error: "List item not found" });
      return;
    }
    const item = db
      .prepare("SELECT * FROM list_items WHERE id = ? AND list_id = ?")
      .get(itemId, id);
    console.log(`[DB] Updated item id=${itemId} in list id=${id}`);
    res.json(item);
    broadcastListUpdate(id);
  } catch (err) {
    console.error(
      `[DB] Failed to update item id=${itemId} in list id=${id}`,
      err
    );
    res.status(500).json({ error: "Failed to update list item" });
    return;
  }
});

app.delete("/lists/:id/items/:itemId", (req, res) => {
  const { id, itemId } = req.params;
  try {
    const stmt = db.prepare(
      "DELETE FROM list_items WHERE id = ? AND list_id = ?"
    );
    const info = stmt.run(itemId, id);
    if (info.changes === 0) {
      res.status(404).json({ error: "List item not found" });
      return;
    }
    console.log(`[DB] Deleted item id=${itemId} from list id=${id}`);
    res.json({ success: true });
    broadcastListUpdate(id);
  } catch (err) {
    console.error(
      `[DB] Failed to delete item id=${itemId} from list id=${id}`,
      err
    );
    res.status(500).json({ error: "Failed to delete list item" });
    return;
  }
});

// Replace app.listen with server.listen
server.listen(PORT, () => {
  console.log(`🚀 API & WS server running at http://localhost:${PORT}`);
});

function buildListItemTree(items) {
  // Create item map with transformed structure
  const itemMap = items.reduce((map, item) => {
    map[item.id] = {
      id: item.id,
      parent_id: item.parent_id,
      text: item.text,
      checked: !!item.checked,
      children: [],
    };
    return map;
  }, {});

  // Partition items into roots and children, building relationships
  return items.reduce((roots, item) => {
    const builtItem = itemMap[item.id];
    if (item.parent_id === null) {
      return [...roots, builtItem];
    } else if (itemMap[item.parent_id]) {
      itemMap[item.parent_id].children.push(builtItem);
    }
    return roots;
  }, []);
}
