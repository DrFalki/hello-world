// In-memory ticket store with JSON-file persistence.
// Holds the full queue state for the practice and exposes mutation
// methods. Every mutation bumps `version` and triggers an async save so
// that connected clients (reception, display, kiosk, smartphone) can be
// kept in sync via WebSocket broadcasts.

import { randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const STATE_FILE = join(DATA_DIR, 'state.json');

/** Local YYYY-MM-DD used to scope the daily running counters. */
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Short, URL-friendly token used in the smartphone ticket link. */
function shortToken() {
  return randomUUID().replace(/-/g, '').slice(0, 8);
}

export class Store {
  constructor(config) {
    this.config = config;
    this.listeners = new Set();
    this.saveTimer = null;
    this.version = 0;
    this.tickets = [];
    this.day = today();
    this.counters = {}; // categoryId -> last issued number for the day
    this._load();
  }

  // ---- persistence -------------------------------------------------------

  _load() {
    try {
      if (existsSync(STATE_FILE)) {
        const raw = JSON.parse(readFileSync(STATE_FILE, 'utf8'));
        this.day = raw.day || today();
        this.counters = raw.counters || {};
        this.tickets = Array.isArray(raw.tickets) ? raw.tickets : [];
        this.version = raw.version || 0;
      }
    } catch (err) {
      console.error('[store] could not load state, starting fresh:', err.message);
    }
    // If the persisted state is from a previous day, roll over automatically.
    this._rolloverIfNeeded();
  }

  _save() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
        writeFileSync(
          STATE_FILE,
          JSON.stringify(
            { day: this.day, counters: this.counters, tickets: this.tickets, version: this.version },
            null,
            2,
          ),
        );
      } catch (err) {
        console.error('[store] save failed:', err.message);
      }
    }, 250);
  }

  // ---- change notification ----------------------------------------------

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _emit(event) {
    this.version += 1;
    this._save();
    for (const fn of this.listeners) {
      try {
        fn(event, this.snapshot());
      } catch (err) {
        console.error('[store] listener error:', err.message);
      }
    }
  }

  // ---- helpers -----------------------------------------------------------

  _category(id) {
    return this.config.categories.find((c) => c.id === id);
  }

  _rolloverIfNeeded() {
    if (this.day !== today()) {
      this.day = today();
      this.counters = {};
      // Keep only tickets that are still actively in play would be odd across
      // days; a fresh day starts with an empty board.
      this.tickets = [];
    }
  }

  // ---- public read -------------------------------------------------------

  snapshot() {
    this._rolloverIfNeeded();
    return {
      version: this.version,
      day: this.day,
      practiceName: this.config.practiceName,
      displaySubtitle: this.config.displaySubtitle,
      language: this.config.language,
      rooms: this.config.rooms,
      providers: this.config.providers,
      categories: this.config.categories,
      tickets: this.tickets,
      stats: this._stats(),
    };
  }

  _stats() {
    const by = (s) => this.tickets.filter((t) => t.status === s).length;
    return {
      waiting: by('waiting'),
      called: by('called'),
      serving: by('serving'),
      done: by('done'),
      total: this.tickets.length,
    };
  }

  // ---- mutations ---------------------------------------------------------

  /** Issue a new ticket. source: reception | kiosk | qr */
  createTicket({ categoryId, source = 'reception', name = '', priority }) {
    this._rolloverIfNeeded();
    const category = this._category(categoryId);
    if (!category) throw new Error(`Unbekannte Kategorie: ${categoryId}`);

    const next = (this.counters[categoryId] || 0) + 1;
    this.counters[categoryId] = next;

    const ticket = {
      id: randomUUID(),
      token: shortToken(),
      number: `${category.prefix}${String(next).padStart(2, '0')}`,
      seq: next,
      categoryId,
      categoryLabel: category.label,
      color: category.color,
      priority: typeof priority === 'number' ? priority : category.priority || 0,
      name: name.trim(),
      source,
      status: 'waiting',
      room: null,
      provider: null,
      createdAt: Date.now(),
      calledAt: null,
      servedAt: null,
      doneAt: null,
      recallCount: 0,
    };
    this.tickets.push(ticket);
    this._emit({ type: 'created', ticketId: ticket.id });
    return ticket;
  }

  _find(id) {
    return this.tickets.find((t) => t.id === id || t.token === id);
  }

  /** Ordered list of waiting tickets: higher priority first, then FIFO. */
  _waitingOrdered(categoryId = null) {
    return this.tickets
      .filter((t) => t.status === 'waiting' && (!categoryId || t.categoryId === categoryId))
      .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
  }

  /** Call a specific ticket to a room/provider. */
  callTicket(id, { room = null, provider = null } = {}) {
    const t = this._find(id);
    if (!t) throw new Error('Ticket nicht gefunden');
    t.status = 'called';
    t.room = room || t.room;
    t.provider = provider || t.provider;
    t.calledAt = Date.now();
    this._emit({ type: 'called', ticketId: t.id, ticket: t });
    return t;
  }

  /** Call the next waiting ticket (optionally filtered by category). */
  callNext({ room = null, provider = null, categoryId = null } = {}) {
    const next = this._waitingOrdered(categoryId)[0];
    if (!next) return null;
    return this.callTicket(next.id, { room, provider });
  }

  /** Re-announce an already called ticket (re-trigger chime on display). */
  recallTicket(id) {
    const t = this._find(id);
    if (!t) throw new Error('Ticket nicht gefunden');
    t.recallCount += 1;
    t.calledAt = Date.now();
    if (t.status === 'serving') t.status = 'called';
    this._emit({ type: 'called', ticketId: t.id, ticket: t });
    return t;
  }

  setStatus(id, status) {
    const t = this._find(id);
    if (!t) throw new Error('Ticket nicht gefunden');
    const allowed = ['waiting', 'called', 'serving', 'done', 'skipped', 'cancelled'];
    if (!allowed.includes(status)) throw new Error(`Ungültiger Status: ${status}`);
    t.status = status;
    if (status === 'serving') t.servedAt = Date.now();
    if (status === 'done') t.doneAt = Date.now();
    this._emit({ type: 'status', ticketId: t.id, status });
    return t;
  }

  removeTicket(id) {
    const idx = this.tickets.findIndex((t) => t.id === id || t.token === id);
    if (idx === -1) throw new Error('Ticket nicht gefunden');
    const [t] = this.tickets.splice(idx, 1);
    this._emit({ type: 'removed', ticketId: t.id });
    return t;
  }

  /** Clear the board (manual daily reset). */
  reset() {
    this.tickets = [];
    this.counters = {};
    this.day = today();
    this._emit({ type: 'reset' });
  }
}
