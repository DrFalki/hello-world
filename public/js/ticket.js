import { connect } from '/js/common.js';

// token is the last path segment of /t/:token (or ?id= fallback)
const token =
  new URLSearchParams(location.search).get('id') ||
  location.pathname.split('/').filter(Boolean).pop();

const els = {
  practice: document.getElementById('practice'),
  pnum: document.getElementById('pnum'),
  pcat: document.getElementById('pcat'),
  statebox: document.getElementById('statebox'),
  ahead: document.getElementById('ahead'),
};

let vibratedFor = '';

function aheadOf(state, t) {
  return state.tickets.filter(
    (x) =>
      x.status === 'waiting' &&
      (x.priority > t.priority || (x.priority === t.priority && x.createdAt < t.createdAt)),
  ).length;
}

function render(state) {
  els.practice.textContent = state.practiceName;
  const t = state.tickets.find((x) => x.token === token || x.id === token);

  if (!t) {
    els.pnum.textContent = '–';
    els.statebox.className = 'statebox b-done';
    els.statebox.textContent = 'Ticket nicht gefunden oder Tag bereits zurückgesetzt.';
    els.ahead.textContent = '';
    return;
  }

  els.pnum.textContent = t.number;
  els.pnum.style.color = t.color;
  els.pcat.textContent = t.categoryLabel;

  els.statebox.className = 'statebox b-' + t.status;
  const called = t.status === 'called' || t.status === 'serving';

  if (t.status === 'waiting') {
    const n = aheadOf(state, t);
    els.statebox.textContent = 'Bitte warten';
    els.ahead.innerHTML =
      n === 0
        ? '<b>Sie sind als Nächstes dran.</b>'
        : `<b>${n}</b> ${n === 1 ? 'Person ist' : 'Personen sind'} vor Ihnen`;
  } else if (called) {
    els.statebox.classList.add('pulse');
    els.statebox.textContent = t.room ? `Sie werden aufgerufen → ${t.room}` : 'Sie werden aufgerufen!';
    els.ahead.innerHTML = t.provider ? `bei ${t.provider}` : '';
    // gentle haptic feedback once per call
    const key = `${t.id}:${t.calledAt}:${t.recallCount}`;
    if (key !== vibratedFor) {
      vibratedFor = key;
      if (navigator.vibrate) navigator.vibrate([200, 80, 200]);
    }
  } else if (t.status === 'done') {
    els.statebox.textContent = 'Erledigt – vielen Dank!';
    els.ahead.textContent = '';
  } else {
    els.statebox.textContent = t.status === 'skipped' ? 'Bitte bei der Anmeldung melden.' : 'Storniert';
    els.ahead.textContent = '';
  }
}

connect((state) => render(state));
