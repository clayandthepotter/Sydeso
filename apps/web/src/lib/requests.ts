/** The request's title is its first line, cut at a word boundary. The user never types one. */
export function titleFrom(description: string) {
  const firstLine = description.split(/\r?\n/).map(line => line.trim()).find(Boolean) ?? "";
  const firstSentence = firstLine.split(/(?<=[.!?])\s/)[0] ?? firstLine;
  const limit = 120;
  if (firstSentence.length <= limit) return firstSentence.replace(/[.!?]$/, "");
  const cut = firstSentence.slice(0, limit);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 60))}…`;
}
