// Praxis Ticket System — HTTP + WebSocket server.
//
// Serves the four front-ends (Anmeldung, Wartezimmer-Display, Kiosk,
// Smartphone-Ticket) as static files and exposes a small REST API plus a
// WebSocket channel that pushes live state to every connected screen.

import express from 'express';
import { WebSocketServer } from 'ws';
import QRCode from 'qrcode';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { Store } from './lib/store.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf8'));
const store = new Store(config);

const app = express();
app.use(express.json());

// ---- REST API ------------------------------------------------------------

app.get('/api/state', (_req, res) => res.json(store.snapshot()));

app.post('/api/tickets', (req, res) => {
  try {
    const { categoryId, source, name, priority } = req.body || {};
    const ticket = store.createTicket({ categoryId, source, name, priority });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/call', (req, res) => {
  try {
    const { room, provider } = req.body || {};
    res.json(store.callTicket(req.params.id, { room, provider }));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/recall', (req, res) => {
  try {
    res.json(store.recallTicket(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/tickets/:id/status', (req, res) => {
  try {
    res.json(store.setStatus(req.params.id, (req.body || {}).status));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tickets/:id', (req, res) => {
  try {
    res.json(store.removeTicket(req.params.id));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/call-next', (req, res) => {
  try {
    const { room, provider, categoryId } = req.body || {};
    const ticket = store.callNext({ room, provider, categoryId });
    if (!ticket) return res.status(404).json({ error: 'Keine wartenden Tickets' });
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/reset', (_req, res) => {
  store.reset();
  res.json({ ok: true });
});

// Single ticket lookup for the smartphone view.
app.get('/api/tickets/:id', (req, res) => {
  const t = store.snapshot().tickets.find((x) => x.id === req.params.id || x.token === req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket nicht gefunden' });
  const ahead = store
    .snapshot()
    .tickets.filter((x) => x.status === 'waiting' && (x.priority > t.priority || (x.priority === t.priority && x.createdAt < t.createdAt))).length;
  res.json({ ...t, ahead });
});

// QR code as SVG. The client passes the absolute URL it wants encoded so the
// code always points at the host the browser actually reached.
app.get('/api/qr', async (req, res) => {
  const data = String(req.query.data || '');
  if (!data) return res.status(400).send('missing data');
  try {
    const svg = await QRCode.toString(data, { type: 'svg', margin: 1, width: 320 });
    res.type('svg').send(svg);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Short link target for the smartphone ticket (printed/shown as QR).
app.get('/t/:token', (_req, res) => res.sendFile(join(__dirname, 'public', 'ticket.html')));

app.use(express.static(join(__dirname, 'public')));

// ---- WebSocket -----------------------------------------------------------

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'state', event: { type: 'init' }, state: store.snapshot() }));
});

store.onChange((event, state) => broadcast({ type: 'state', event, state }));

server.listen(PORT, () => {
  console.log(`\n  Praxis Ticket System läuft auf:`);
  console.log(`    Übersicht / Hub     →  http://localhost:${PORT}/`);
  console.log(`    Anmeldung           →  http://localhost:${PORT}/reception.html`);
  console.log(`    Wartezimmer (PAuL)  →  http://localhost:${PORT}/display.html`);
  console.log(`    Kiosk (Selbstcheck) →  http://localhost:${PORT}/kiosk.html`);
  console.log(`\n  Im Praxisnetz erreichbar über die LAN-IP dieses Rechners.\n`);
});
