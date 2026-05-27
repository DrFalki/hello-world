# Praxis-QM-Bot

KI-Chatbot für MFAs einer Arztpraxis. Antwortet auf Fragen zum
Qualitätsmanagement-Handbuch (Hygiene, Notfallplan, SOPs …) **ausschließlich**
auf Basis der hochgeladenen QM-PDFs, mit Quellenangaben.

**Stack:** Next.js 15 · Clerk (Auth) · Supabase + pgvector (Vektor-DB) ·
Voyage AI (Embeddings) · Claude `sonnet-4-6` (LLM)

---

## Setup (einmalig, ca. 1 h)

### 1. Accounts anlegen (alle EU-Region wählen!)

| Dienst    | URL                                   | Was holen?                                       |
|-----------|---------------------------------------|--------------------------------------------------|
| Anthropic | https://console.anthropic.com/        | API-Key (sk-ant-…), **AVV unterzeichnen**        |
| Voyage AI | https://dash.voyageai.com/            | API-Key (pa-…)                                   |
| Supabase  | https://supabase.com/dashboard        | Neues Projekt in **Frankfurt**, URL + Keys       |
| Clerk     | https://dashboard.clerk.com/          | App anlegen, Publishable + Secret Key            |
| Vercel    | https://vercel.com/                   | Account, später Repo verbinden                   |

### 2. Datenbank initialisieren

Supabase Dashboard → **SQL Editor** → Inhalt von
[`supabase/migrations/001_init.sql`](./supabase/migrations/001_init.sql)
einfügen → **Run**.

### 3. Lokale Entwicklung

```bash
cp .env.example .env.local
# .env.local mit deinen Keys ausfüllen
npm install
npm run dev
```

App läuft auf http://localhost:3000.

### 4. Erste MFA + Admin anlegen

1. Im Clerk-Dashboard einen User mit deiner Praxis-E-Mail anlegen
   (diese muss in `ADMIN_EMAILS` in `.env.local` stehen → nur du darfst hochladen).
2. Browser → http://localhost:3000 → einloggen → `/admin/upload` → erste PDF hochladen.
3. Zurück zur Chat-Seite → Testfrage stellen.

### 5. Deployment auf Vercel

1. Repo nach GitHub pushen
2. Vercel → Import Project → dieses Repo wählen
3. **Region: Frankfurt (`fra1`)**
4. Alle Variablen aus `.env.local` als Environment Variables hinzufügen
5. Deploy

---

## DSGVO-Checkliste vor Praxis-Einsatz

- [ ] AVV mit Anthropic abgeschlossen
- [ ] AVV mit Supabase abgeschlossen
- [ ] AVV mit Vercel abgeschlossen
- [ ] AVV mit Clerk abgeschlossen
- [ ] Alle Dienste auf EU-Region eingestellt
- [ ] **KEINE Patientendaten** in den hochgeladenen QM-PDFs (vor Upload prüfen!)
- [ ] Eintrag im Verzeichnis der Verarbeitungstätigkeiten (VVT)
- [ ] TOMs dokumentiert (Verschlüsselung, Zugriffsrechte, Backup)

---

## Architektur

```
MFA-Browser
   │ HTTPS + Clerk-Session
   ▼
Next.js (Vercel/Frankfurt)
   ├── /                — Chat-UI
   ├── /admin/upload    — PDF-Upload (nur ADMIN_EMAILS)
   ├── /api/chat        — RAG: embed → search → Claude streamen
   └── /api/ingest      — PDF → unpdf → chunks → Voyage → Supabase
   │
   ▼
Supabase (Postgres + pgvector, Frankfurt)
   ├── documents        — Chunks + Embeddings
   └── chat_logs        — Audit-Log
```

## Kostenrahmen

ca. 10–70 €/Monat für eine kleine Praxis (5 MFAs).
Siehe Plan-Dokument für Details.
