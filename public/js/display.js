import { connect, api } from '/js/common.js';

let state = null;
let soundOn = false;
let audioCtx = null;
let lang = 'de-DE';
let lastCallKey = '';

const els = {
  practice: document.getElementById('practice'),
  subtitle: document.getElementById('subtitle'),
  clock: document.getElementById('clock'),
  current: document.getElementById('current'),
  recent: document.getElementById('recent'),
  waitcount: document.getElementById('waitcount'),
  enable: document.getElementById('enable'),
};

// --- clock ---
function tick() {
  const d = new Date();
  els.clock.textContent = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}
setInterval(tick, 1000);
tick();

// --- sound: a soft two-tone chime via WebAudio + spoken announcement ---
els.enable.addEventListener('click', () => {
  soundOn = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  // unlock speech synthesis on user gesture
  try { window.speechSynthesis.getVoices(); } catch (_) {}
  els.enable.style.display = 'none';
});

function chime() {
  if (!soundOn || !audioCtx) return;
  const now = audioCtx.currentTime;
  [880, 1175].forEach((freq, i) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    const t = now + i * 0.18;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(g).connect(audioCtx.destination);
    o.start(t);
    o.stop(t + 0.42);
  });
}

function speak(ticket) {
  if (!soundOn || !window.speechSynthesis) return;
  const digits = ticket.number.split('').join(' ');
  let text = `Nummer ${digits}`;
  if (ticket.room) text += `, bitte in ${ticket.room}`;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = 0.95;
  setTimeout(() => window.speechSynthesis.speak(u), 850); // after the chime
}

function announce(ticket) {
  chime();
  speak(ticket);
  els.current.classList.remove('flash');
  void els.current.offsetWidth; // restart animation
  els.current.classList.add('flash');
}

// --- rendering ---
function calledTickets() {
  return state.tickets
    .filter((t) => t.status === 'called' || t.status === 'serving')
    .sort((a, b) => b.calledAt - a.calledAt);
}

function renderCurrent() {
  const called = calledTickets();
  const top = called[0];
  if (!top) {
    els.current.innerHTML = `<div class="idle">Bitte Platz nehmen.<br>Sie werden aufgerufen.</div>`;
    return;
  }
  els.current.innerHTML = `
    <div class="currentLabel">Aufruf</div>
    <div class="bigwrap">
      <div class="bignum" style="color:${top.color}">${top.number}</div>
      ${top.room ? `<div class="bigroom">→ ${escapeHtml(top.room)}</div>` : ''}
      ${top.provider ? `<div class="bigsub">${escapeHtml(top.provider)}</div>` : ''}
    </div>`;
}

function renderRecent() {
  const called = calledTickets().slice(0, 6);
  els.recent.innerHTML = called
    .map(
      (t) => `<li><span class="rn" style="color:${t.color}">${t.number}</span>
        <span class="rr">${t.room ? escapeHtml(t.room) : ''}</span></li>`,
    )
    .join('');
  const waiting = state.stats.waiting;
  els.waitcount.textContent = waiting
    ? `${waiting} wartende${waiting === 1 ? 's' : ''} Ticket${waiting === 1 ? '' : 's'}`
    : 'Keine wartenden Tickets';
}

function render() {
  els.practice.textContent = state.practiceName;
  els.subtitle.textContent = state.displaySubtitle || '';
  document.title = state.practiceName;
  lang = state.language || 'de-DE';
  renderCurrent();
  renderRecent();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

connect(
  (s) => {
    state = s;
    render();
  },
  (event, s) => {
    state = s;
    // Trigger announcement when a ticket is (re)called.
    if (event.type === 'called') {
      const t = (s.tickets.find((x) => x.id === event.ticketId)) || event.ticket;
      if (t) {
        const key = `${t.id}:${t.calledAt}:${t.recallCount}`;
        if (key !== lastCallKey) {
          lastCallKey = key;
          renderCurrent();
          renderRecent();
          announce(t);
        }
      }
    }
  },
);
