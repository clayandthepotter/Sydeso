/**
 * A service throws this until its build step is done.
 * The scenarios fail with it. Remove a throw only when its scenario passes.
 */
export class NotBuiltError extends Error {
  override readonly name = "NotBuiltError";

  constructor(
    readonly service: string,
    readonly buildStep: number,
  ) {
    super(`${service} is not built yet. See build step ${buildStep} in HANDOFF.md.`);
  }
}
