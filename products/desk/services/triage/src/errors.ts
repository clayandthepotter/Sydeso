/** The model declined the note. Triage sends it to review. It does not retry. */
export class ExtractionRefusedError extends Error {
  override readonly name = "ExtractionRefusedError";
}
