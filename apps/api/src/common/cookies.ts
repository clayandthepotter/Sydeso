/** Reads one cookie from a raw Cookie header without pulling in a parser dependency. */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rest] = part.split("=");
    if (rawKey?.trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }

  return undefined;
}
