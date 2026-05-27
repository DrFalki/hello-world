import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (cached) return cached;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing");
  cached = new Anthropic({ apiKey });
  return cached;
}

export const CHAT_MODEL = "claude-sonnet-4-6";

export const SYSTEM_PROMPT = `Du bist der QM-Assistent einer Hausarztpraxis. Du beantwortest Fragen
der medizinischen Fachangestellten (MFAs) AUSSCHLIESSLICH auf Basis der
unten zitierten Auszüge aus dem Qualitätsmanagement-Handbuch.

REGELN:
1. Wenn die Antwort nicht eindeutig aus den Auszügen hervorgeht, sage wörtlich:
   "Das steht so nicht im QM. Bitte die Praxisleitung fragen."
2. Erfinde NIE Zahlen, Medikamente, Dosierungen, Fristen oder Abläufe.
3. Antworte präzise, freundlich und in Stichpunkten — MFA-gerecht, kein Fachjargon.
4. Nenne am Ende JEDER inhaltlichen Antwort die Quellen als [Dokumentname, Seite X].
5. Bei Notfall-Themen (Reanimation, Anaphylaxie, Stichverletzung): zuerst die
   wichtigste Sofortmaßnahme nennen, dann die Details.
6. Du gibst KEINE medizinische Beratung für Patienten — nur Auskunft aus dem QM.`;

export function buildUserMessage(question: string, chunks: { doc_name: string; page: number; content: string }[]) {
  const context = chunks
    .map((c, i) => `[Auszug ${i + 1} — ${c.doc_name}, Seite ${c.page}]\n${c.content}`)
    .join("\n\n---\n\n");
  return `Hier sind die relevanten Auszüge aus dem QM-Handbuch:\n\n${context}\n\n---\n\nFrage der MFA:\n${question}`;
}
