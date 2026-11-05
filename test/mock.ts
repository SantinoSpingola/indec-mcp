import { IndecClient } from "../src/client/client.js";

export interface MockCall {
  url: URL;
  headers: Record<string, string>;
}

type Handler = (call: MockCall) => { status?: number; body: unknown; headers?: Record<string, string> };

/** fetch falso que emula el comportamiento básico de PostgREST. */
export function mockFetch(handlers: Record<string, Handler>) {
  const calls: MockCall[] = [];
  const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const call = { url, headers };
    calls.push(call);
    const name = decodeURIComponent(url.pathname.replace(/^\/v1\//, "").replace(/\/$/, ""));
    const h = handlers[name];
    if (!h) return new Response(JSON.stringify({ code: "PGRST205", message: `sin handler para ${name}` }), { status: 404 });
    const out = h(call);
    return new Response(JSON.stringify(out.body), {
      status: out.status ?? 200,
      headers: { "Content-Type": "application/json", ...(out.headers ?? {}) },
    });
  }) as typeof fetch;
  return { fetchImpl, calls };
}

export function makeClient(handlers: Record<string, Handler>, extra: ConstructorParameters<typeof IndecClient>[0] = {}) {
  const { fetchImpl, calls } = mockFetch(handlers);
  const client = new IndecClient({
    token: "test-token",
    baseUrl: "https://mock.indec.test/v1/",
    fetchImpl,
    sleep: async () => {},
    cacheTtlMs: 0,
    ...extra,
  });
  return { client, calls };
}
