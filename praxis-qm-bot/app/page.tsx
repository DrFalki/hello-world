"use client";

import { useState } from "react";

type Source = { doc_name: string; page: number };
type Turn = { question: string; answer: string; sources: Source[] };

export default function ChatPage() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || pending) return;
    setQuestion("");
    setPending(true);

    const turn: Turn = { question: q, answer: "", sources: [] };
    setHistory((h) => [...h, turn]);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: q }),
    });
    if (!res.ok || !res.body) {
      turn.answer = "Fehler beim Abrufen der Antwort.";
      setHistory((h) => [...h.slice(0, -1), { ...turn }]);
      setPending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const evt of events) {
        const lines = evt.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
        const dataLine = lines.find((l) => l.startsWith("data:"))?.slice(5).trim();
        if (!eventLine || !dataLine) continue;
        if (eventLine === "sources") turn.sources = JSON.parse(dataLine);
        else if (eventLine === "token") turn.answer += JSON.parse(dataLine);
        setHistory((h) => [...h.slice(0, -1), { ...turn }]);
      }
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        {history.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
            <h2 className="mb-2 text-lg font-semibold text-slate-900">Willkommen 👋</h2>
            <p className="text-sm">
              Stell mir eine Frage zum QM-Handbuch — z. B.{" "}
              <em>„Wie lange müssen die Hände desinfiziert werden?"</em> oder{" "}
              <em>„Was tun bei einer Stichverletzung?"</em>
            </p>
          </div>
        )}
        {history.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="rounded-lg bg-slate-200 px-4 py-3 text-sm">
              <strong className="block text-xs uppercase tracking-wide text-slate-500">Du</strong>
              {t.question}
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
              <strong className="block text-xs uppercase tracking-wide text-slate-500">
                QM-Assistent
              </strong>
              <div className="whitespace-pre-wrap">{t.answer || "…"}</div>
              {t.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.sources.map((s, j) => (
                    <span
                      key={j}
                      className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      📄 {s.doc_name} · S. {s.page}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={ask}
        className="sticky bottom-4 flex gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Frage ans QM…"
          disabled={pending}
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={pending || !question.trim()}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "…" : "Fragen"}
        </button>
      </form>
    </div>
  );
}
