import { auth, currentUser } from "@clerk/nextjs/server";
import { extractText } from "unpdf";
import { chunkPage } from "@/lib/chunker";
import { embedDocuments } from "@/lib/voyage";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (!email || !ADMIN_EMAILS.includes(email)) return null;
  return userId;
}

export async function POST(req: Request) {
  const adminId = await requireAdmin();
  if (!adminId) return new Response("Forbidden", { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return new Response("No file", { status: 400 });

  const docName = file.name;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { text: pages, totalPages } = await extractText(bytes, { mergePages: false });

  const sb = supabaseAdmin();
  await sb.from("documents").delete().eq("doc_name", docName);

  let totalChunks = 0;

  for (let i = 0; i < pages.length; i++) {
    const pageNum = i + 1;
    const pageText = pages[i] ?? "";
    const chunks = chunkPage(pageText);
    if (chunks.length === 0) continue;

    const embeddings = await embedDocuments(chunks);
    const rows = chunks.map((content, j) => ({
      doc_name: docName,
      page: pageNum,
      content,
      embedding: embeddings[j],
    }));

    const { error } = await sb.from("documents").insert(rows);
    if (error) throw error;
    totalChunks += rows.length;
  }

  return Response.json({ ok: true, docName, pages: totalPages, chunks: totalChunks });
}
