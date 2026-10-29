/**
 * Encrypts tenant secrets, such as a Linear API key, with AES-GCM.
 * The key is a Worker secret (DESK_SECRETS_KEY): 32 random bytes in base64.
 * The stored value is "v1." + base64(iv + ciphertext). The tenant ID is bound as associated data,
 * so a value copied to another tenant's row does not decrypt.
 */
const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export class SecretBox {
  private readonly key: Promise<CryptoKey>;

  constructor(base64Key: string) {
    const raw = fromBase64(base64Key);
    if (raw.byteLength !== 32) throw new Error("DESK_SECRETS_KEY must be 32 bytes in base64");
    this.key = crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  async seal(plaintext: string, tenantId: string): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(tenantId) },
      await this.key,
      new TextEncoder().encode(plaintext),
    );
    const out = new Uint8Array(iv.byteLength + ciphertext.byteLength);
    out.set(iv);
    out.set(new Uint8Array(ciphertext), iv.byteLength);
    return `v1.${toBase64(out)}`;
  }

  async open(sealed: string, tenantId: string): Promise<string> {
    if (!sealed.startsWith("v1.")) throw new Error("Unknown secret format");
    const bytes = fromBase64(sealed.slice(3));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: bytes.slice(0, 12), additionalData: new TextEncoder().encode(tenantId) },
      await this.key,
      bytes.slice(12),
    );
    return new TextDecoder().decode(plaintext);
  }
}
