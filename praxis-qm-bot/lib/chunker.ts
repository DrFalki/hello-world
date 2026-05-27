// Naive word-based chunker: ~targetWords pro Chunk, overlap am Wortrand.
// Reicht für QM-Texte; bei sehr strukturierten Doks später durch
// markdown-aware splitting ersetzen.
export function chunkPage(text: string, targetWords = 220, overlapWords = 40): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= targetWords) return [text.trim()].filter(Boolean);

  const chunks: string[] = [];
  const step = targetWords - overlapWords;
  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + targetWords);
    if (slice.length === 0) break;
    chunks.push(slice.join(" "));
    if (i + targetWords >= words.length) break;
  }
  return chunks;
}
