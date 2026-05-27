const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
const MODEL = "voyage-3";

type VoyageResponse = { data: { embedding: number[] }[] };

async function call(input: string[], inputType: "document" | "query"): Promise<number[][]> {
  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, input, input_type: inputType }),
  });
  if (!res.ok) throw new Error(`Voyage error ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as VoyageResponse;
  return json.data.map((d) => d.embedding);
}

export const embedDocuments = (texts: string[]) => call(texts, "document");
export const embedQuery = async (text: string) => (await call([text], "query"))[0];
