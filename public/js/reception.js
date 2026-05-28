import { connect, api, toast, STATUS_LABEL, waitMinutes } from '/js/common.js';

let state = null;

const els = {
  stats: document.getElementById('stats'),
  catbtns: document.getElementById('catbtns'),
  room: document.getElementById('room'),
  provider: document.getElementById('provider'),
  name: document.getElementById('name'),
  rows: document.getElementById('rows'),
  empty: document.getElementById('empty'),
  filter: document.getElementById('filter'),
};

function fillSelects() {
  els.room.innerHTML =
    '<option value="">Raum wählen…</option>' +
    state.rooms.map((r) => `<option value="${r.label}">${r.label}</option>`).join('');
  els.provider.innerHTML =
    '<option value="">Behandler (optional)…</option>' +
    state.providers.map((p) => `<option value="${p.label}">${p.label}</option>`).join('');

  els.catbtns.innerHTML = state.categories
    .map(
      (c) => `<button class="catbtn" style="background:${c.color}" data-cat="${c.id}">
        ${c.label}<small>Präfix ${c.prefix}${c.priority > 0 ? ' · Priorität' : ''}</small></button>`,
    )
    .join('');
  els.catbtns.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => createTicket(b.dataset.cat)),
  );
}

async function createTicket(categoryId) {
  try {
    const name = els.name.value;
    const t = await api('/api/tickets', 'POST', { categoryId, source: 'reception', name });
    els.name.value = '';
    toast(`Ticket ${t.number} erstellt`);
  } catch (e) {
    toast('Fehler: ' + e.message);
  }
}

document.getElementById('callNext').addEventListener('click', async () => {
  try {
    const t = await api('/api/call-next', 'POST', {
      room: els.room.value,
      provider: els.provider.value,
    });
    toast(`Aufgerufen: ${t.number}${t.room ? ' → ' + t.room : ''}`);
  } catch (e) {
    toast(e.message);
  }
});

document.getElementById('reset').addEventListener('click', async () => {
  if (!confirm('Alle Tickets von heute löschen und Zähler zurücksetzen?')) return;
  await api('/api/reset', 'POST');
  toast('Zurückgesetzt');
});

els.filter.addEventListener('change', render);

async function act(id, action, body) {
  try {
    await api(`/api/tickets/${id}/${action}`, 'POST', body);
  } catch (e) {
    toast(e.message);
  }
}

function renderStats() {
  const s = state.stats;
  els.stats.innerHTML = [
    ['Wartend', s.waiting],
    ['Aufgerufen', s.called],
    ['In Behandlung', s.serving],
    ['Erledigt', s.done],
  ]
    .map(([label, n]) => `<div class="stat"><b>${n}</b><span>${label}</span></div>`)
    .join('');
}

function visibleTickets() {
  const f = els.filter.value;
  let list = [...state.tickets];
  if (f === 'active') list = list.filter((t) => ['waiting', 'called', 'serving'].includes(t.status));
  else if (f !== 'all') list = list.filter((t) => t.status === f);
  // priority desc, then creation order
  return list.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
}

function render() {
  if (!state) return;
  renderStats();
  const list = visibleTickets();
  els.empty.style.display = list.length ? 'none' : 'block';

  els.rows.innerHTML = list
    .map((t) => {
      const called = t.status === 'called' || t.status === 'serving';
      return `<tr class="tickrow">
        <td><span class="num" style="color:${t.color}">${t.number}</span>${t.name ? `<div class="muted" style="font-size:11px">${escapeHtml(t.name)}</div>` : ''}</td>
        <td>${t.categoryLabel}${t.priority > 0 ? ' <span class="tag" style="background:#dc2626">!</span>' : ''}</td>
        <td><span class="statusbadge s-${t.status}">${STATUS_LABEL[t.status]}</span></td>
        <td>${t.room ? escapeHtml(t.room) : '—'}</td>
        <td>${t.status === 'done' ? '—' : waitMinutes(t.createdAt) + ' min'}</td>
        <td><div class="actions">${rowActions(t, called)}</div></td>
      </tr>`;
    })
    .join('');

  els.rows.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', () => handleRowAction(b.dataset.id, b.dataset.act)),
  );
}

function rowActions(t, called) {
  const btns = [];
  if (t.status === 'waiting') {
    btns.push(`<button class="btn ok sm" data-act="call" data-id="${t.id}">Aufrufen</button>`);
  }
  if (called) {
    btns.push(`<button class="btn ghost sm" data-act="recall" data-id="${t.id}">🔔 Erneut</button>`);
    if (t.status === 'called')
      btns.push(`<button class="btn sm" data-act="serving" data-id="${t.id}">In Behandlung</button>`);
    btns.push(`<button class="btn ok sm" data-act="done" data-id="${t.id}">Fertig</button>`);
  }
  if (t.status === 'waiting' || called) {
    btns.push(`<button class="btn warn sm" data-act="skip" data-id="${t.id}">Überspringen</button>`);
  }
  btns.push(`<button class="btn danger sm" data-act="remove" data-id="${t.id}">✕</button>`);
  return btns.join('');
}

async function handleRowAction(id, action) {
  switch (action) {
    case 'call':
      return act(id, 'call', { room: els.room.value, provider: els.provider.value });
    case 'recall':
      return act(id, 'recall');
    case 'serving':
      return act(id, 'status', { status: 'serving' });
    case 'done':
      return act(id, 'status', { status: 'done' });
    case 'skip':
      return act(id, 'status', { status: 'skipped' });
    case 'remove':
      try {
        await api(`/api/tickets/${id}`, 'DELETE');
      } catch (e) {
        toast(e.message);
      }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let initialized = false;
connect((s) => {
  state = s;
  if (!initialized) {
    fillSelects();
    initialized = true;
  }
  render();
});
