import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { WebSocketServer, WebSocket } from 'ws';

const db = new Database('schedules.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS schedules (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const clients = new Map<WebSocket, Set<string>>();

  // API routes
  app.post('/api/schedules', (req, res) => {
    const { id, data } = req.body;
    if (!id || !data) {
      return res.status(400).json({ error: 'Missing id or data' });
    }
    const stmt = db.prepare('INSERT OR REPLACE INTO schedules (id, data, updated_at) VALUES (?, ?, ?)');
    stmt.run(id, JSON.stringify(data), Date.now());

    // Broadcast to WebSocket subscribers
    const msg = JSON.stringify({ type: 'update', id, data });
    for (const [ws, subs] of clients.entries()) {
      if (subs.has(id) && ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }

    res.json({ success: true, id });
  });

  app.get('/api/schedules/:id', (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('SELECT data FROM schedules WHERE id = ?');
    const row = stmt.get(id) as { data: string } | undefined;
    if (!row) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ data: JSON.parse(row.data) });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const httpServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws) => {
    clients.set(ws, new Set());

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'subscribe') {
          clients.set(ws, new Set(parsed.ids));
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });
}

startServer();
