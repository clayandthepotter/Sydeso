import { api } from "../../../../../lib/api";

/**
 * Streams an artifact's bytes from the API to the browser. The session stays in the
 * httpOnly cookie; the browser never talks to the API or object storage directly.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ artifactId: string }> }) {
  const { artifactId } = await params;
  const upstream = await api.fetchArtifactContent(artifactId);

  if (!upstream.ok) {
    return new Response(upstream.status === 404 ? "Artifact not found" : "Could not fetch the artifact", {
      status: upstream.status,
    });
  }

  const headers = new Headers();
  for (const name of ["content-type", "content-length", "content-disposition", "x-sydeso-checksum", "cache-control"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(upstream.body, { status: 200, headers });
}
