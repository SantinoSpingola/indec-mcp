import { describe, expect, it } from "vitest";
import { IndecClient } from "../src/client/client.js";
import { IndecApiError } from "../src/client/errors.js";
import { makeClient } from "./mock.js";

const rows = (n: number, from = 0) => Array.from({ length: n }, (_, i) => ({ id: from + i }));

describe("IndecClient", () => {
  it("envía Bearer, Accept y Prefer: count=exact, y lee el total de Content-Range", async () => {
    const { client, calls } = makeClient({
      pobreza_eph: () => ({ status: 206, body: rows(2), headers: { "Content-Range": "0-1/5" } }),
    });
    const r = await client.query({ dataset: "pobreza_eph", limit: 2 }, { count: true });
    expect(r).toMatchObject({ total: 5, nextOffset: 2, status: 206 });
    expect(calls[0]!.headers).toMatchObject({ Authorization: "Bearer test-token", Accept: "application/json", Prefer: "count=exact" });
  });

  it("no manda Prefer sin count y nextOffset es null cuando se agotó", async () => {
    const { client, calls } = makeClient({ pobreza_eph: () => ({ body: rows(3), headers: { "Content-Range": "0-2/3" } }) });
    const r = await client.query({ dataset: "pobreza_eph" });
    expect(r.nextOffset).toBeNull();
    expect(calls[0]!.headers.Prefer).toBeUndefined();
  });

  it("queryAll recorre páginas hasta agotar", async () => {
    const { client, calls } = makeClient({
      pobreza_eph: ({ url }) => {
        const off = Number(url.searchParams.get("offset") ?? 0);
        const lim = Number(url.searchParams.get("limit"));
        const data = rows(Math.min(lim, 2500 - off), off);
        return { status: off + data.length < 2500 ? 206 : 200, body: data, headers: { "Content-Range": `${off}-${off + data.length - 1}/2500` } };
      },
    });
    const r = await client.queryAll({ dataset: "pobreza_eph" });
    expect(r.rows).toHaveLength(2500);
    expect(r.truncated).toBe(false);
    expect(r.total).toBe(2500);
    expect(calls.map((c) => c.url.searchParams.get("offset"))).toEqual([null, "1000", "2000"]);
  });

  it("queryAll respeta max_rows y marca truncado", async () => {
    const { client } = makeClient({
      pobreza_eph: ({ url }) => {
        const off = Number(url.searchParams.get("offset") ?? 0);
        const lim = Number(url.searchParams.get("limit"));
        return { status: 206, body: rows(lim, off), headers: { "Content-Range": `${off}-${off + lim - 1}/99999` } };
      },
    });
    const r = await client.queryAll({ dataset: "pobreza_eph" }, 1500);
    expect(r.rows).toHaveLength(1500);
    expect(r.truncated).toBe(true);
  });

  it("reintenta ante 503 y 429 y luego tiene éxito", async () => {
    let n = 0;
    const { client, calls } = makeClient({
      pobreza_eph: () => (++n < 3 ? { status: n === 1 ? 503 : 429, body: { message: "busy" } } : { body: rows(1) }),
    });
    const r = await client.query({ dataset: "pobreza_eph" });
    expect(r.rows).toHaveLength(1);
    expect(calls).toHaveLength(3);
  });

  it("agota los reintentos y reporta el error", async () => {
    const { client, calls } = makeClient({ pobreza_eph: () => ({ status: 503, body: { message: "caído" } }) }, { maxRetries: 2 });
    await expect(client.query({ dataset: "pobreza_eph" })).rejects.toMatchObject({ status: 503 });
    expect(calls).toHaveLength(3);
  });

  it("401 no se reintenta y da un mensaje accionable", async () => {
    const { client, calls } = makeClient({ pobreza_eph: () => ({ status: 401, body: { code: "42501", message: "permission denied for schema api" } }) });
    const err = await client.query({ dataset: "pobreza_eph" }).catch((e) => e);
    expect(err).toBeInstanceOf(IndecApiError);
    expect(err.toUserMessage()).toMatch(/INDEC_API_TOKEN/);
    expect(calls).toHaveLength(1);
  });

  it("400 expone code, message y hint de PostgREST", async () => {
    const { client } = makeClient({ pobreza_eph: () => ({ status: 400, body: { code: "PGRST100", message: "failed to parse filter", hint: "revisá el operador" } }) });
    const err = (await client.query({ dataset: "pobreza_eph" }).catch((e) => e)) as IndecApiError;
    expect(err.toUserMessage()).toContain("PGRST100");
    expect(err.toUserMessage()).toContain("revisá el operador");
  });

  it("sin token falla antes de llamar a la red", async () => {
    const { calls } = makeClient({});
    const c = new IndecClient({ baseUrl: "https://mock.indec.test/v1/", fetchImpl: (async () => { throw new Error("no debería llamarse"); }) as typeof fetch });
    // El constructor toma INDEC_API_TOKEN del entorno; lo limpiamos para el test.
    const saved = process.env.INDEC_API_TOKEN;
    delete process.env.INDEC_API_TOKEN;
    try {
      const sinToken = new IndecClient({ baseUrl: "https://mock.indec.test/v1/" });
      expect(sinToken.hasToken).toBe(false);
      await expect(sinToken.query({ dataset: "pobreza_eph" })).rejects.toMatchObject({ status: 401 });
    } finally {
      if (saved !== undefined) process.env.INDEC_API_TOKEN = saved;
    }
    expect(c).toBeDefined();
    expect(calls).toHaveLength(0);
  });

  it("cachea respuestas iguales y deduplica las concurrentes", async () => {
    let hits = 0;
    const { client } = makeClient({ pobreza_eph: () => (hits++, { body: rows(1) }) }, { cacheTtlMs: 60_000 });
    await Promise.all([client.query({ dataset: "pobreza_eph" }), client.query({ dataset: "pobreza_eph" })]);
    await client.query({ dataset: "pobreza_eph" });
    expect(hits).toBe(1);
  });

  it("rechaza respuestas que no son listas", async () => {
    const { client } = makeClient({ pobreza_eph: () => ({ body: { raro: true } }) });
    await expect(client.query({ dataset: "pobreza_eph" })).rejects.toBeInstanceOf(IndecApiError);
  });
});

describe("seguridad y buenas prácticas del cliente", () => {
  it("se identifica con un User-Agent propio", async () => {
    const { client, calls } = makeClient({ pobreza_eph: () => ({ body: rows(1) }) });
    await client.query({ dataset: "pobreza_eph" });
    expect(String(calls[0]!.headers["User-Agent"])).toMatch(/^indec-mcp\/\d+\.\d+\.\d+ \(\+https:\/\//);
  });

  it("no acepta una URL base sin HTTPS (el token viaja en cada consulta)", () => {
    expect(() => new IndecClient({ baseUrl: "http://api.ejemplo.com/v1/", token: "t" })).toThrow(/https/);
    expect(() => new IndecClient({ baseUrl: "ftp://x/", token: "t" })).toThrow(/https/);
    expect(() => new IndecClient({ baseUrl: "no es una url", token: "t" })).toThrow(/inválida/);
  });

  it("acepta HTTPS y localhost (desarrollo)", () => {
    expect(() => new IndecClient({ baseUrl: "https://api.indec.gob.ar/v1/", token: "t" })).not.toThrow();
    expect(() => new IndecClient({ baseUrl: "http://localhost:3000/v1/", token: "t" })).not.toThrow();
    expect(() => new IndecClient({ baseUrl: "http://127.0.0.1:3000/", token: "t" })).not.toThrow();
  });
});

describe("versión", () => {
  it("coincide con package.json", async () => {
    const { readFileSync } = await import("node:fs");
    const { SERVER_VERSION } = await import("../src/version.js");
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string };
    expect(SERVER_VERSION).toBe(pkg.version);
  });
});
