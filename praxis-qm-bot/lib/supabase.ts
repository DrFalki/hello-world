import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export type DocumentChunk = {
  id: string;
  doc_name: string;
  page: number;
  content: string;
};

export async function searchChunks(queryEmbedding: number[], limit = 5): Promise<DocumentChunk[]> {
  const { data, error } = await supabaseAdmin().rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: limit,
  });
  if (error) throw error;
  return data as DocumentChunk[];
}
