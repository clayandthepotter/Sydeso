import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";

export interface NewPasskey {
  readonly credentialId: string;
  /** Base64url. */
  readonly publicKey: string;
  readonly counter: number;
  readonly transports: readonly string[];
  readonly deviceType: string;
  readonly backedUp: boolean;
}

export interface StoredPasskey {
  readonly credentialId: string;
  readonly publicKey: string;
  readonly counter: number;
  readonly transports: readonly string[];
}

export interface PasskeyOptions {
  /** JSON for the browser. */
  readonly options: unknown;
  readonly challenge: string;
}

/** WebAuthn. The real adapter uses SimpleWebAuthn. Tests use a fake. */
export interface PasskeyVerifierPort {
  registrationOptions(input: { webauthnUserId: string; userName: string; displayName: string }): Promise<PasskeyOptions>;
  verifyRegistration(input: { response: unknown; challenge: string }): Promise<NewPasskey | null>;
  authenticationOptions(): Promise<PasskeyOptions>;
  /** The credential ID in a sign-in response, before verification. */
  credentialIdOf(response: unknown): string | null;
  verifyAuthentication(input: {
    response: unknown;
    challenge: string;
    passkey: StoredPasskey;
  }): Promise<{ readonly newCounter: number } | null>;
}

export interface RelyingParty {
  /** The host, for example desk.sydeso.com. */
  readonly rpId: string;
  readonly rpName: string;
  /** The full origin, for example https://desk.sydeso.com. */
  readonly origin: string;
}

const base64UrlToBytes = (value: string): Uint8Array<ArrayBuffer> => {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
};

const bytesToBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

type Transport = NonNullable<RegistrationResponseJSON["response"]["transports"]>[number];

export class SimpleWebAuthnVerifier implements PasskeyVerifierPort {
  constructor(private readonly rp: RelyingParty) {}

  async registrationOptions(input: { webauthnUserId: string; userName: string; displayName: string }) {
    const options = await generateRegistrationOptions({
      rpName: this.rp.rpName,
      rpID: this.rp.rpId,
      userID: base64UrlToBytes(input.webauthnUserId),
      userName: input.userName,
      userDisplayName: input.displayName,
      attestationType: "none",
      authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
    });
    return { options, challenge: options.challenge };
  }

  async verifyRegistration(input: { response: unknown; challenge: string }): Promise<NewPasskey | null> {
    try {
      const result = await verifyRegistrationResponse({
        response: input.response as RegistrationResponseJSON,
        expectedChallenge: input.challenge,
        expectedOrigin: this.rp.origin,
        expectedRPID: this.rp.rpId,
        requireUserVerification: false,
      });
      if (!result.verified) return null;
      const { credential, credentialDeviceType, credentialBackedUp } = result.registrationInfo;
      return {
        credentialId: credential.id,
        publicKey: bytesToBase64Url(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      };
    } catch {
      return null;
    }
  }

  async authenticationOptions() {
    const options = await generateAuthenticationOptions({ rpID: this.rp.rpId, userVerification: "preferred" });
    return { options, challenge: options.challenge };
  }

  credentialIdOf(response: unknown): string | null {
    const id = (response as { id?: unknown } | null)?.id;
    return typeof id === "string" && id.length > 0 ? id : null;
  }

  async verifyAuthentication(input: { response: unknown; challenge: string; passkey: StoredPasskey }) {
    try {
      const result = await verifyAuthenticationResponse({
        response: input.response as AuthenticationResponseJSON,
        expectedChallenge: input.challenge,
        expectedOrigin: this.rp.origin,
        expectedRPID: this.rp.rpId,
        requireUserVerification: false,
        credential: {
          id: input.passkey.credentialId,
          publicKey: base64UrlToBytes(input.passkey.publicKey),
          counter: input.passkey.counter,
          transports: input.passkey.transports as Transport[],
        },
      });
      return result.verified ? { newCounter: result.authenticationInfo.newCounter } : null;
    } catch {
      return null;
    }
  }
}
