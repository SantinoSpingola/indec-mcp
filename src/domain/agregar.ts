import { InputError } from "../client/errors.js";

export type Agg = "sum" | "avg" | "min" | "max" | "count";

export interface GrupoAgregado {
  grupo: Record<string, unknown>;
  n: number;
  /** Cantidad de filas con valor numérico usado en el cálculo. */
  n_numericas: number;
  valor: number | null;
}

/** Convierte a número solo si es un número o un texto numérico (los signos convencionales quedan fuera). */
export function aNumero(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function agregar(
  rows: ReadonlyArray<Record<string, unknown>>,
  groupBy: string[],
  valueColumn: string | undefined,
  agg: Agg,
): GrupoAgregado[] {
  if (agg !== "count" && !valueColumn) throw new InputError(`La agregación "${agg}" requiere value_column.`);
  const groups = new Map<string, { grupo: Record<string, unknown>; n: number; nums: number[] }>();
  for (const r of rows) {
    const grupo: Record<string, unknown> = {};
    for (const g of groupBy) grupo[g] = r[g] ?? null;
    const key = JSON.stringify(groupBy.map((g) => grupo[g]));
    let e = groups.get(key);
    if (!e) groups.set(key, (e = { grupo, n: 0, nums: [] }));
    e.n++;
    if (valueColumn) {
      const n = aNumero(r[valueColumn]);
      if (n !== null) e.nums.push(n);
    }
  }
  const out: GrupoAgregado[] = [];
  for (const { grupo, n, nums } of groups.values()) {
    let valor: number | null;
    switch (agg) {
      case "count":
        valor = n;
        break;
      case "sum":
        valor = nums.length ? nums.reduce((a, b) => a + b, 0) : null;
        break;
      case "avg":
        valor = nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
        break;
      case "min":
        valor = nums.length ? Math.min(...nums) : null;
        break;
      case "max":
        valor = nums.length ? Math.max(...nums) : null;
        break;
    }
    out.push({ grupo, n, n_numericas: nums.length, valor });
  }
  return out;
}
