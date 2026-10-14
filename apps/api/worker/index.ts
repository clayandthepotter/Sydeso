import { Container, getContainer } from "@cloudflare/containers";

/**
 * The Worker in front of the API container at api.sydeso.com. Every request is forwarded to a
 * single long-lived container instance; secrets reach the Node process as environment variables.
 */
interface Env {
  API: DurableObjectNamespace<ApiContainer>;
  // Secrets, set with `wrangler secret put`.
  DATABASE_URL: string;
  DIRECT_URL: string;
  STORAGE_ACCESS_KEY_ID?: string;
  STORAGE_SECRET_ACCESS_KEY?: string;
  // Plain vars from wrangler.jsonc.
  WEB_ORIGIN: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
  STORAGE_FORCE_PATH_STYLE?: string;
  STORAGE_MAX_UPLOAD_BYTES?: string;
  SESSION_TTL_DAYS?: string;
  INVITATION_TTL_DAYS?: string;
}

const forwardedVars = [
  "DATABASE_URL",
  "DIRECT_URL",
  "WEB_ORIGIN",
  "STORAGE_ENDPOINT",
  "STORAGE_BUCKET",
  "STORAGE_REGION",
  "STORAGE_FORCE_PATH_STYLE",
  "STORAGE_ACCESS_KEY_ID",
  "STORAGE_SECRET_ACCESS_KEY",
  "STORAGE_MAX_UPLOAD_BYTES",
  "SESSION_TTL_DAYS",
  "INVITATION_TTL_DAYS",
] as const;

export class ApiContainer extends Container<Env> {
  defaultPort = 4000;
  // The API keeps warm between requests; a cold start runs migrations and boots Nest.
  sleepAfter = "1h";

  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, env);
    const vars: Record<string, string> = { PORT: "4000", NODE_ENV: "production" };
    for (const name of forwardedVars) {
      const value = env[name];
      if (typeof value === "string" && value.length > 0) vars[name] = value;
    }
    this.envVars = vars;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return getContainer(env.API, "api").fetch(request);
  },
} satisfies ExportedHandler<Env>;
