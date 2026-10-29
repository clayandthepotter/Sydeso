import { SimpleWebAuthnVerifier } from "@desk/identity";
import { createApp, type AppEnv } from "./app.js";

interface Env extends AppEnv {
  readonly RP_ID: string;
  readonly RP_NAME: string;
}

const systemClock = { now: () => new Date() };

export default {
  fetch(request, env) {
    const verifier = new SimpleWebAuthnVerifier({ rpId: env.RP_ID, rpName: env.RP_NAME, origin: env.APP_ORIGIN });
    return createApp({ env, clock: systemClock, verifier }).fetch(request);
  },
} satisfies ExportedHandler<Env>;
