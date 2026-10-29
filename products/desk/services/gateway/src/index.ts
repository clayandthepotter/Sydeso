import { NotBuiltError } from "@desk/domain";

/**
 * desk-api. Serves the PWA and the API at desk.sydeso.com behind Cloudflare Access.
 * It holds the per user Durable Object that pushes events over WebSocket.
 */
export async function handleRequest(_request: Request): Promise<Response> {
  throw new NotBuiltError("desk-api", 2);
}
