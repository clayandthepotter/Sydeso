import type { NewPasskey, PasskeyOptions, PasskeyVerifierPort, StoredPasskey } from "@desk/identity";

/** What a fake authenticator sends. The real browser sends a WebAuthn JSON response. */
export interface FakePasskeyResponse {
  readonly credentialId: string;
  readonly challenge: string;
}

/**
 * A fake WebAuthn verifier. A response is valid when it echoes the challenge.
 * A sign-in response is valid only for the credential that it names.
 */
export class FakePasskeyVerifier implements PasskeyVerifierPort {
  private count = 0;

  private next(kind: string): PasskeyOptions {
    this.count += 1;
    const challenge = `${kind}-challenge-${this.count}`;
    return { options: { challenge }, challenge };
  }

  async registrationOptions(): Promise<PasskeyOptions> {
    return this.next("register");
  }

  async verifyRegistration(input: { response: unknown; challenge: string }): Promise<NewPasskey | null> {
    const response = input.response as Partial<FakePasskeyResponse> | null;
    if (!response?.credentialId || response.challenge !== input.challenge) return null;
    return {
      credentialId: response.credentialId,
      publicKey: `public-key-${response.credentialId}`,
      counter: 0,
      transports: ["internal"],
      deviceType: "multiDevice",
      backedUp: true,
    };
  }

  async authenticationOptions(): Promise<PasskeyOptions> {
    return this.next("login");
  }

  credentialIdOf(response: unknown): string | null {
    const id = (response as Partial<FakePasskeyResponse> | null)?.credentialId;
    return typeof id === "string" ? id : null;
  }

  async verifyAuthentication(input: { response: unknown; challenge: string; passkey: StoredPasskey }) {
    const response = input.response as Partial<FakePasskeyResponse> | null;
    const valid =
      response?.challenge === input.challenge &&
      response.credentialId === input.passkey.credentialId &&
      input.passkey.publicKey === `public-key-${input.passkey.credentialId}`;
    return valid ? { newCounter: input.passkey.counter + 1 } : null;
  }
}
