import { describe, expect, it } from "vitest";
import { ClaudeExtraction, ExtractionRefusedError } from "../src/index.js";

const request = {
  noteId: "n1",
  text: "send Dana the SOW by Friday",
  capturedAt: "2026-10-28T09:00:00.000-04:00",
  timeZone: "America/La_Paz",
  projects: ["Client Work", "Sydeso"],
};

interface Captured {
  url: string;
  headers: Headers;
  body: Record<string, unknown>;
}

/** A fake Messages API. It records the request and returns the given message. */
const fakeApi = (message: Record<string, unknown>) => {
  const calls: Captured[] = [];
  const fetch = async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(input instanceof Request ? input.url : input),
      headers: new Headers(init?.headers),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(
      JSON.stringify({
        id: "msg_1",
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        stop_reason: "end_turn",
        stop_sequence: null,
        usage: { input_tokens: 10, output_tokens: 10 },
        ...message,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
};

const textMessage = (json: unknown) => ({ content: [{ type: "text", text: JSON.stringify(json) }] });

const config = (fetch: typeof globalThis.fetch) => ({
  apiKey: "test-key",
  baseURL: "https://gateway.example/v1/account/desk-ai/anthropic",
  model: "claude-opus-5-5",
  effort: "low" as const,
  fallbacks: true,
  fetch,
});

const sow = {
  action: "Send Dana the SOW",
  project: "Client Work",
  dueDate: "2026-10-30",
  durationMinutes: 30,
  priority: "P2",
  confidence: 0.92,
};

describe("ClaudeExtraction", () => {
  it("returns the items from the structured output", async () => {
    const api = fakeApi(textMessage({ items: [sow] }));

    const items = await new ClaudeExtraction(config(api.fetch)).extract(request);

    expect(items).toEqual([sow]);
  });

  it("calls the configured gateway with the model, effort, schema, and fallbacks", async () => {
    const api = fakeApi(textMessage({ items: [] }));

    await new ClaudeExtraction(config(api.fetch)).extract(request);

    const [call] = api.calls;
    expect(call?.url).toBe("https://gateway.example/v1/account/desk-ai/anthropic/v1/messages");
    expect(call?.body).toMatchObject({
      model: "claude-opus-5-5",
      output_config: { effort: "low", format: { type: "json_schema" } },
      fallbacks: "default",
    });
    expect(call?.headers.get("anthropic-beta")).toContain("server-side-fallback-2026-07-01");
    expect(call?.body.thinking).toBeUndefined();
  });

  it("keeps the system prompt stable and puts the note in the user turn", async () => {
    const first = fakeApi(textMessage({ items: [] }));
    const second = fakeApi(textMessage({ items: [] }));

    await new ClaudeExtraction(config(first.fetch)).extract(request);
    await new ClaudeExtraction(config(second.fetch)).extract({ ...request, text: "other note", projects: ["Other"] });

    expect(first.calls[0]?.body.system).toEqual(second.calls[0]?.body.system);
    expect(JSON.stringify(first.calls[0]?.body.system)).not.toContain("Dana");
    expect(JSON.stringify(first.calls[0]?.body.messages)).toContain("send Dana the SOW by Friday");
    expect(JSON.stringify(first.calls[0]?.body.messages)).toContain("Client Work");
    expect(JSON.stringify(first.calls[0]?.body.messages)).toContain("Wednesday");
  });

  it("omits fallbacks when they are off", async () => {
    const api = fakeApi(textMessage({ items: [] }));

    await new ClaudeExtraction({ ...config(api.fetch), fallbacks: false }).extract(request);

    expect(api.calls[0]?.body.fallbacks).toBeUndefined();
    expect(api.calls[0]?.headers.get("anthropic-beta") ?? "").not.toContain("server-side-fallback");
  });

  it("throws ExtractionRefusedError on a refusal", async () => {
    const api = fakeApi({ content: [], stop_reason: "refusal", stop_details: { type: "refusal", category: null, explanation: null } });

    await expect(new ClaudeExtraction(config(api.fetch)).extract(request)).rejects.toThrow(ExtractionRefusedError);
  });

  it("sends an item with bad fields to review with zero confidence", async () => {
    const api = fakeApi(textMessage({ items: [{ ...sow, dueDate: "next Friday", durationMinutes: -5 }] }));

    const [item] = await new ClaudeExtraction(config(api.fetch)).extract(request);

    expect(item).toMatchObject({ dueDate: null, durationMinutes: null, confidence: 0 });
  });

  it("clamps confidence into 0 to 1", async () => {
    const api = fakeApi(textMessage({ items: [{ ...sow, confidence: 1.4 }] }));

    const [item] = await new ClaudeExtraction(config(api.fetch)).extract(request);

    expect(item?.confidence).toBe(1);
  });
});
