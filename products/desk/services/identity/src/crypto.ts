/** Random tokens and hashes. They use Web Crypto, so they run in Workers and in browsers. */

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

/** A URL safe random token with the given number of random bytes. */
export function randomToken(bytes = 32): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

/** A short random code in lowercase letters and digits, without look-alike characters. */
export function randomCode(length: number): string {
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (value) => ALPHABET[value % ALPHABET.length]).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
