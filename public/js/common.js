// Shared helpers: live WebSocket connection + tiny REST + UI utilities.

export function connect(onState, onEvent) {
  let ws;
  let retry = 0;
  const statusDot = document.querySelector('.dot');

  function setOnline(on) {
    if (statusDot) statusDot.classList.toggle('off', !on);
  }

  function open() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    ws = new WebSocket(`${proto}://${location.host}/ws`);
    ws.onopen = () => { retry = 0; setOnline(true); };
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'state') {
        if (onState) onState(msg.state);
        if (onEvent && msg.event) onEvent(msg.event, msg.state);
      }
    };
    ws.onclose = () => {
      setOnline(false);
      retry = Math.min(retry + 1, 6);
      setTimeout(open, 500 * retry);
    };
    ws.onerror = () => ws.close();
  }
  open();
}

export async function api(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

let toastTimer;
export function toast(text) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

export const STATUS_LABEL = {
  waiting: 'wartet',
  called: 'aufgerufen',
  serving: 'in Behandlung',
  done: 'erledigt',
  skipped: 'übersprungen',
  cancelled: 'storniert',
};

export function waitMinutes(ts) {
  return Math.max(0, Math.round((Date.now() - ts) / 60000));
}
