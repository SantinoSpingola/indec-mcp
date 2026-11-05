import { DATASETS } from "../datasets/registry.generated.js";
import type { DatasetDef } from "../datasets/types.js";
import { InputError } from "./errors.js";

export const MAX_PAGE_SIZE = 1000;

export const OPERATORS = ["eq", "neq", "gt", "gte", "lt", "lte", "like", "ilike", "in", "is"] as const;
export type Operator = (typeof OPERATORS)[number];

export type FilterValue = string | number | boolean | null | Array<string | number>;

export interface Filter {
  column: string;
  op: Operator;
  value: FilterValue;
}

export interface OrderTerm {
  column: string;
  dir?: "asc" | "desc";
}

export interface QuerySpec {
  dataset: string;
  select?: string[];
  filters?: Filter[];
  order?: OrderTerm[];
  limit?: number;
  offset?: number;
}

const byId = new Map<string, DatasetDef>(DATASETS.map((d) => [d.id, d]));

export function listDatasets(): readonly DatasetDef[] {
  return DATASETS;
}

export function getDataset(id: string): DatasetDef {
  const ds = byId.get(id);
  if (!ds) {
    throw new InputError(`Dataset desconocido "${id}". Disponibles: ${DATASETS.map((d) => d.id).join(", ")}`);
  }
  return ds;
}

/** Valor escalar → texto para PostgREST. Sin escapado de URL (eso lo hace URLSearchParams). */
function scalar(v: string | number | boolean | null): string {
  if (v === null) return "null";
  return String(v);
}

/** Elemento dentro de `in.(...)`: se entrecomilla si tiene caracteres especiales de PostgREST. */
function listItem(v: string | number): string {
  const s = String(v);
  if (/[,()"\\\s]/.test(s) || s === "") return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return s;
}

export function encodeFilter(f: Filter): string {
  switch (f.op) {
    case "in": {
      if (!Array.isArray(f.value) || f.value.length === 0) {
        throw new InputError(`El filtro "in" sobre "${f.column}" requiere una lista no vacía.`);
      }
      return `in.(${f.value.map(listItem).join(",")})`;
    }
    case "is": {
      const ok = f.value === null || f.value === true || f.value === false || f.value === "unknown";
      if (!ok) throw new InputError(`El filtro "is" sobre "${f.column}" solo admite null, true, false o "unknown".`);
      return `is.${scalar(f.value as string | boolean | null)}`;
    }
    case "like":
    case "ilike": {
      if (typeof f.value !== "string") throw new InputError(`"${f.op}" sobre "${f.column}" requiere texto.`);
      // El usuario puede escribir % o *; PostgREST espera *.
      return `${f.op}.${f.value.replace(/%/g, "*")}`;
    }
    default: {
      if (Array.isArray(f.value)) throw new InputError(`"${f.op}" sobre "${f.column}" requiere un valor escalar.`);
      return `${f.op}.${scalar(f.value)}`;
    }
  }
}

function assertColumn(ds: DatasetDef, name: string): void {
  // La API expone, por cada columna de valor, una columna `<col>_null` con el signo convencional (no figura en el spec).
  const base = name.endsWith("_null") ? name.slice(0, -"_null".length) : name;
  if (!ds.columnas.some((c) => c.name === base)) {
    const hint = ds.columnas.find((c) => c.name.toLowerCase() === name.toLowerCase());
    throw new InputError(
      `La columna "${name}" no existe en ${ds.id}.` +
        (hint ? ` ¿Quisiste decir "${hint.name}"? (los nombres distinguen mayúsculas)` : ` Columnas: ${ds.columnas.map((c) => c.name).join(", ")}`),
    );
  }
}

/**
 * Orden efectivo: el pedido por el usuario + las columnas de la clave primaria que falten,
 * para que la paginación sea estable (requisito explícito del spec).
 */
export function effectiveOrder(ds: DatasetDef, order: OrderTerm[] | undefined): OrderTerm[] {
  const terms = [...(order ?? [])];
  for (const t of terms) assertColumn(ds, t.column);
  const seen = new Set(terms.map((t) => t.column));
  for (const k of ds.claveOrden) if (!seen.has(k)) terms.push({ column: k, dir: "asc" });
  return terms;
}

/** Construye los query params validando dataset, columnas, operadores y límites. */
export function buildSearchParams(q: QuerySpec): URLSearchParams {
  const ds = getDataset(q.dataset);
  const sp = new URLSearchParams();

  if (q.select?.length) {
    for (const c of q.select) assertColumn(ds, c);
    sp.set("select", q.select.join(","));
  }

  for (const f of q.filters ?? []) {
    assertColumn(ds, f.column);
    if (!OPERATORS.includes(f.op)) throw new InputError(`Operador inválido "${f.op}". Válidos: ${OPERATORS.join(", ")}`);
    sp.append(f.column, encodeFilter(f));
  }

  sp.set(
    "order",
    effectiveOrder(ds, q.order)
      .map((t) => (t.dir ? `${t.column}.${t.dir}` : t.column))
      .join(","),
  );

  const limit = q.limit ?? 100;
  if (!Number.isInteger(limit) || limit < 1) throw new InputError("limit debe ser un entero ≥ 1.");
  sp.set("limit", String(Math.min(limit, MAX_PAGE_SIZE)));

  const offset = q.offset ?? 0;
  if (!Number.isInteger(offset) || offset < 0) throw new InputError("offset debe ser un entero ≥ 0.");
  if (offset > 0) sp.set("offset", String(offset));

  return sp;
}

/** `Content-Range: 0-999/103545` | `*\/0` | `0-9/*` → { start, end, total } */
export function parseContentRange(h: string | null): { start: number; end: number; total: number | null } | null {
  if (!h) return null;
  const m = h.match(/^(?:(\d+)-(\d+)|\*)\/(\d+|\*)$/);
  if (!m) return null;
  return {
    start: m[1] ? Number(m[1]) : 0,
    end: m[2] ? Number(m[2]) : -1,
    total: m[3] === "*" || m[3] === undefined ? null : Number(m[3]),
  };
}
