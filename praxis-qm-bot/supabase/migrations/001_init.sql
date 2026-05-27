-- Praxis-QM-Bot: Initial Schema
-- Ausführen via Supabase Dashboard → SQL Editor

create extension if not exists vector;

-- Chunks aus den QM-PDFs (1024-dim für voyage-3)
create table if not exists documents (
  id          uuid primary key default gen_random_uuid(),
  doc_name    text not null,
  page        int  not null,
  content     text not null,
  embedding   vector(1024) not null,
  created_at  timestamptz not null default now()
);

create index if not exists documents_doc_name_idx on documents (doc_name);
create index if not exists documents_embedding_idx
  on documents using hnsw (embedding vector_cosine_ops);

-- Audit-Log aller MFA-Fragen
create table if not exists chat_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  question   text not null,
  answer     text not null,
  sources    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_logs_user_id_idx on chat_logs (user_id);
create index if not exists chat_logs_created_at_idx on chat_logs (created_at desc);

-- Vektorsuche-Funktion (von /api/chat via supabase.rpc('match_chunks') aufgerufen)
create or replace function match_chunks(query_embedding vector(1024), match_count int)
returns table (id uuid, doc_name text, page int, content text)
language sql stable as $$
  select id, doc_name, page, content
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;
