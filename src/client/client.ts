import { createHash } from "node:crypto";
import { IndecApiError, InputError } from "./errors.js";
import { PROJECT_URL, SERVER_NAME, SERVER_VERSION } from "../version.js";
import { MAX_PAGE_SIZE, buildSearchParams, parseContentRange, type QuerySpec } from "./query.js";

export const DEFAULT_BASE_URL = "https://api.indec.gob.ar/v1/";

export interface ClientOptions {
  /** JWT del portal. Si falta, se lee INDEC_API_TOKEN. */
  token?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
  fetchImpl?: typeof fetch;
  /** Para tests: evita esperas reales en los reintentos. */
  sleep?: (ms: number) => Promise<void>;
}

export type Row = Record<string, unknown>;

export interface QueryResult {
  rows: Row[];
  /** Total de filas que cumplen el filtro (solo si se pidió count). */
  total: number | null;
  /** Offset de la próxima página, o null si no hay más. */
  nextOffset: number | null;
  status: number;
}

interface CacheEntry {
  at: number;
  value: QueryResult;
}

const RETRYABLE = new Set([429, 502, 503, 504]);
/** Identifica al cliente ante el INDEC (buena práctica con APIs públicas). */
const USER_AGENT = `${SERVER_NAME}/${SERVER_VERSION} (+${PROJECT_URL})`;

/** El token viaja en cada request: solo se acepta HTTPS (o localhost, para desarrollo y pruebas). */
function assertSafeBaseUrl(base: string): void {
  let u: URL;
  try { u = new URL(base); } catch { throw new InputError(`INDEC_API_BASE_URL inválida: "${base}"`); }
  const local = u.hostname === "localhost" || u.hostname === "127.0.0.1" || u.hostname === "[::1]";
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) {
    throw new InputError(`INDEC_API_BASE_URL debe usar https (el token se envía en cada consulta): "${base}"`);
  }
}

export class IndecClient {
  private readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly cacheTtlMs: number;
  private readonly cacheMax: number;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inflight = new Map<string, Promise<QueryResult>>();

  constructor(opts: ClientOptions = {}) {
    const env = process.env;
    const base = opts.baseUrl ?? env.INDEC_API_BASE_URL ?? DEFAULT_BASE_URL;
    this.baseUrl = base.endsWith("/") ? base : `${base}/`;
    assertSafeBaseUrl(this.baseUrl);
    this.token = opts.token ?? (env.INDEC_API_TOKEN?.trim() || undefined);
    this.timeoutMs = opts.timeoutMs ?? Number(env.INDEC_REQUEST_TIMEOUT_MS ?? 30_000);
    this.maxRetries = opts.maxRetries ?? 3;
    this.cacheTtlMs = opts.cacheTtlMs ?? Number(env.INDEC_CACHE_TTL_SECONDS ?? 3600) * 1000;
    this.cacheMax = opts.cacheMaxEntries ?? 200;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  }

  get hasToken(): boolean {
    return Boolean(this.token);
  }

  /** Una página. `count: true` pide el total exacto (header Prefer: count=exact). */
  async query(q: QuerySpec, opts: { count?: boolean } = {}): Promise<QueryResult> {
    const sp = buildSearchParams(q);
    const url = `${this.baseUrl}${encodeURIComponent(q.dataset)}?${sp.toString()}`;
    const key = `${opts.count ? "C" : "-"}|${url}`;

    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.cacheTtlMs) return hit.value;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const p = this.request(url, Boolean(opts.count), q.offset ?? 0)
      .then((value) => {
        if (this.cacheTtlMs > 0) {
          this.cache.set(key, { at: Date.now(), value });
          if (this.cache.size > this.cacheMax) this.cache.delete(this.cache.keys().next().value!);
        }
        return value;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  /** Recorre páginas de 1000 hasta agotar la tabla o llegar a `maxRows`. */
  async queryAll(q: Omit<QuerySpec, "limit" | "offset">, maxRows = 10_000): Promise<{ rows: Row[]; total: number | null; truncated: boolean }> {
    const rows: Row[] = [];
    let offset = 0;
    let total: number | null = null;
    for (;;) {
      const page = await this.query({ ...q, limit: Math.min(MAX_PAGE_SIZE, maxRows - rows.length), offset }, { count: offset === 0 });
      if (offset === 0) total = page.total;
      rows.push(...page.rows);
      if (page.nextOffset === null) return { rows, total, truncated: false };
      if (rows.length >= maxRows) return { rows, total, truncated: true };
      offset = page.nextOffset;
    }
  }

  /** Descarga el spec OpenAPI público (no requiere token) y devuelve su hash SHA-256 para detectar cambios. */
  async fetchSpecHash(): Promise<string> {
    const res = await this.fetchImpl(this.baseUrl, { headers: { Accept: "application/json", "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(this.timeoutMs) });
    if (!res.ok) throw new IndecApiError(`No se pudo descargar el spec (HTTP ${res.status})`, res.status);
    return createHash("sha256").update(Buffer.from(await res.arrayBuffer())).digest("hex");
  }

  private async request(url: string, count: boolean, offset: number): Promise<QueryResult> {
    if (!this.token) {
      throw new IndecApiError("Falta el token de la API.", 401);
    }
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    };
    if (count) headers.Prefer = "count=exact";

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await this.fetchImpl(url, { method: "GET", headers, signal: AbortSignal.timeout(this.timeoutMs) });
        if (res.status === 200 || res.status === 206) {
          const body = (await res.json()) as unknown;
          if (!Array.isArray(body)) throw new IndecApiError("Respuesta inesperada (no es una lista).", res.status);
          const range = parseContentRange(res.headers.get("Content-Range"));
          const total = range?.total ?? null;
          const end = offset + body.length;
          const more = total !== null ? end < total : res.status === 206 || body.length >= MAX_PAGE_SIZE;
          return { rows: body as Row[], total, nextOffset: more && body.length > 0 ? end : null, status: res.status };
        }

        const err = await toApiError(res);
        if (RETRYABLE.has(res.status) && attempt < this.maxRetries) {
          lastErr = err;
          await this.sleep(retryDelayMs(attempt, res.headers.get("Retry-After")));
          continue;
        }
        throw err;
      } catch (e) {
        if (e instanceof IndecApiError || e instanceof InputError) throw e;
        // Errores de red / timeout: reintentar.
        lastErr = e;
        if (attempt < this.maxRetries) {
          await this.sleep(retryDelayMs(attempt, null));
          continue;
        }
      }
    }
    if (lastErr instanceof IndecApiError) throw lastErr;
    throw new IndecApiError(`No se pudo conectar con la API del INDEC: ${(lastErr as Error)?.message ?? "error de red"}`, 0);
  }
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const ra = retryAfter ? Number(retryAfter) : NaN;
  if (Number.isFinite(ra) && ra >= 0) return Math.min(ra * 1000, 30_000);
  return Math.min(500 * 2 ** attempt, 8_000) + Math.floor(Math.random() * 250);
}

async function toApiError(res: Response): Promise<IndecApiError> {
  let body: { code?: string; message?: string; details?: string | null; hint?: string | null } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    /* cuerpo no JSON */
  }
  return new IndecApiError(body.message ?? res.statusText ?? "Error", res.status, body.code, body.hint, body.details);
}
