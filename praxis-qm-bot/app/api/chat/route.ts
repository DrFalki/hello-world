import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { anthropic, CHAT_MODEL, SYSTEM_PROMPT, buildUserMessage } from "@/lib/anthropic";
import { embedQuery } from "@/lib/voyage";
import { searchChunks, supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ question: z.string().min(2).max(1000) });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const { question } = parsed.data;

  const queryEmbedding = await embedQuery(question);
  const chunks = await searchChunks(queryEmbedding, 5);
  const userMessage = buildUserMessage(question, chunks);

  const encoder = new TextEncoder();
  let answer = "";

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: sources\ndata: ${JSON.stringify(
            chunks.map((c) => ({ doc_name: c.doc_name, page: c.page })),
          )}\n\n`,
        ),
      );

      const messageStream = anthropic().messages.stream({
        model: CHAT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });

      for await (const event of messageStream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          answer += event.delta.text;
          controller.enqueue(
            encoder.encode(`event: token\ndata: ${JSON.stringify(event.delta.text)}\n\n`),
          );
        }
      }

      controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
      controller.close();

      await supabaseAdmin().from("chat_logs").insert({
        user_id: userId,
        question,
        answer,
        sources: chunks.map((c) => ({ doc_name: c.doc_name, page: c.page })),
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
