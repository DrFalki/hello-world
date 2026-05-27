"use client";

import { useState } from "react";

type Result = { ok: true; docName: string; pages: number; chunks: number } | { error: string };

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setResult(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/ingest", { method: "POST", body: fd });
    if (res.ok) setResult(await res.json());
    else setResult({ error: `${res.status} ${await res.text()}` });
    setBusy(false);
    setFile(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">QM-Dokumente hochladen</h1>
        <p className="mt-1 text-sm text-slate-600">
          PDFs aus dem QM-Ordner hier hochladen. Beim erneuten Upload eines Dokuments mit gleichem
          Dateinamen werden die alten Chunks ersetzt.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-slate-200 bg-white p-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={busy}
          className="block w-full text-sm"
        />
        <button
          type="submit"
          disabled={!file || busy}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Verarbeite…" : "Hochladen & indexieren"}
        </button>
      </form>

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          {"ok" in result ? (
            <span className="text-emerald-700">
              ✓ <strong>{result.docName}</strong> — {result.pages} Seiten, {result.chunks} Chunks
              indexiert.
            </span>
          ) : (
            <span className="text-red-700">✗ Fehler: {result.error}</span>
          )}
        </div>
      )}
    </div>
  );
}
