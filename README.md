# Praxis Ticket System

Digitales Ticket-/Warteschlangen-System für die Arztpraxis – mit
Wartezimmer-Display im Stil von **PAuL (tomedo)** und Ticket-Erstellung
über Anmeldung, Kiosk und QR-Code aufs Smartphone. Nachbau im Geist von
[quickticket.io](https://quickticket.io), aber **self-hosted** und ohne
Cloud: läuft komplett im Praxisnetz.

> Hiermit beginne ich die Reise, die Medizin zu verändern.

## Was es kann

- **Anmeldung** (`/reception.html`) – Tickets ziehen, Patient:innen in Räume
  aufrufen, Reihenfolge nach Priorität (z. B. Notfall) und Wartezeit,
  Status verwalten (wartet → aufgerufen → in Behandlung → fertig).
- **Wartezimmer-Display** (`/display.html`) – Großbildschirm mit dem aktuellen
  Aufruf (Nummer + Raum + Behandler), Liste der letzten Aufrufe, Uhr,
  **Gong + gesprochener Aufruf** ("Nummer T 0 5, bitte in Raum 3").
- **Kiosk / Selbst-Check-in** (`/kiosk.html`) – Touch-Terminal, an dem
  Patient:innen selbst eine Nummer ziehen und einen **QR-Code** erhalten.
- **Smartphone-Ticket** (`/t/:token`) – Über den QR-Code öffnet sich das
  Live-Ticket: Position in der Schlange, Aufruf-Benachrichtigung (mit
  Vibration), aktualisiert sich automatisch.

Alle Ansichten sind über **WebSockets in Echtzeit gespiegelt** – ein Aufruf
an der Anmeldung erscheint sofort auf dem Display und allen Handys.

## Schnellstart

```bash
npm install
npm start
```

Dann im Browser öffnen:

| Ansicht            | URL                                |
|--------------------|------------------------------------|
| Übersicht / Hub    | `http://localhost:3000/`           |
| Anmeldung          | `http://localhost:3000/reception.html` |
| Wartezimmer-Display| `http://localhost:3000/display.html`   |
| Kiosk              | `http://localhost:3000/kiosk.html`     |

### Im Praxisnetz

Damit Display, Kiosk und die Handys der Patient:innen mitlaufen, müssen alle
Geräte im selben Netz (WLAN/LAN) sein. Statt `localhost` die **LAN-IP** des
Server-Rechners verwenden, z. B. `http://192.168.1.50:3000/display.html`.
Die QR-Codes auf dem Kiosk zeigen automatisch auf diese Adresse.

Display am besten im **Vollbild** (F11) laufen lassen und einmal auf
„Ton aktivieren" tippen (Browser erlauben Ton erst nach einer Interaktion).

## Konfiguration

`config.json` anpassen – Praxisname, Räume, Behandler:innen und
Ticket-Kategorien (mit Präfix, Farbe und Priorität):

```json
{
  "practiceName": "Praxis Dr. Falk",
  "rooms": [{ "id": "raum1", "label": "Raum 1" }],
  "providers": [{ "id": "falk", "label": "Dr. Falk" }],
  "categories": [
    { "id": "notfall", "label": "Notfall", "prefix": "N", "color": "#dc2626", "priority": 100 }
  ]
}
```

Höhere `priority` = wird zuerst aufgerufen.

## Technik

- **Backend:** Node.js (Express) + WebSocket-Server (`ws`), Zustand
  persistiert in `data/state.json` (täglicher Reset automatisch).
- **Frontend:** statisches HTML/CSS/JS, kein Build-Schritt nötig.
- **QR-Codes:** serverseitig via `qrcode` erzeugt.

### Datenschutz

Tickets enthalten standardmäßig nur eine Nummer – **keine Klarnamen**
nötig. Es gibt keine externe Verbindung, alle Daten bleiben auf dem
Praxis-Rechner. Beim Tageswechsel wird das Board automatisch geleert.

## REST-API (Auszug)

| Methode & Pfad                 | Zweck                          |
|--------------------------------|--------------------------------|
| `GET  /api/state`              | Kompletter Zustand             |
| `POST /api/tickets`            | Ticket erstellen               |
| `POST /api/call-next`          | Nächsten aufrufen              |
| `POST /api/tickets/:id/call`   | Bestimmtes Ticket aufrufen     |
| `POST /api/tickets/:id/recall` | Erneut aufrufen (Gong)         |
| `POST /api/tickets/:id/status` | Status setzen                  |
| `POST /api/reset`              | Tag zurücksetzen               |

Echtzeit-Updates über `ws://<host>/ws`.
