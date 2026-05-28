import { api } from '/js/common.js';

const els = {
  practice: document.getElementById('practice'),
  cats: document.getElementById('cats'),
  view: document.getElementById('ticketview'),
  tnum: document.getElementById('tnum'),
  tcat: document.getElementById('tcat'),
  qr: document.getElementById('qr'),
  count: document.getElementById('count'),
};

let resetTimer = null;

async function init() {
  const state = await api('/api/state');
  els.practice.textContent = state.practiceName;
  document.title = state.practiceName + ' – Anmeldung';
  els.cats.innerHTML = state.categories
    .map(
      (c) => `<button class="kcat" style="background:${c.color}" data-cat="${c.id}">
        ${c.label}<small>Tippen, um eine Nummer zu ziehen</small></button>`,
    )
    .join('');
  els.cats.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => draw(b.dataset.cat)),
  );
}

async function draw(categoryId) {
  try {
    const t = await api('/api/tickets', 'POST', { categoryId, source: 'kiosk' });
    showTicket(t);
  } catch (e) {
    alert('Fehler: ' + e.message);
  }
}

async function showTicket(t) {
  els.tnum.textContent = t.number;
  els.tnum.style.color = t.color;
  els.tcat.textContent = t.categoryLabel;

  const url = `${location.origin}/t/${t.token}`;
  const svg = await fetch('/api/qr?data=' + encodeURIComponent(url)).then((r) => r.text());
  els.qr.innerHTML = svg;

  els.cats.style.display = 'none';
  els.view.classList.add('show');

  // Auto return to the category screen after a short while.
  let secs = 15;
  els.count.textContent = `Zurück zum Start in ${secs}s …`;
  clearInterval(resetTimer);
  resetTimer = setInterval(() => {
    secs -= 1;
    els.count.textContent = `Zurück zum Start in ${secs}s …`;
    if (secs <= 0) reset();
  }, 1000);
}

function reset() {
  clearInterval(resetTimer);
  els.view.classList.remove('show');
  els.cats.style.display = '';
}

els.view.addEventListener('click', (e) => {
  // tapping the QR area should not dismiss; tap elsewhere returns
  if (!e.target.closest('.qr')) reset();
});

init();
