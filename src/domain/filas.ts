import { SIGNOS_CONVENCIONALES } from "./signos.js";

export type Fila = Record<string, unknown>;

const SUFIJO_NULL = "_null";

/**
 * La API devuelve, además de cada columna de valor, una columna hermana `<col>_null` con el signo
 * convencional cuando el valor es nulo (ej. valor_FOB=null, valor_FOB_null="s"). No figura en el spec.
 * Para no duplicar el ancho de cada fila: se descartan las `_null` vacías y las no vacías se mueven a `razon_nulo`.
 */
export function limpiarFilas(rows: ReadonlyArray<Fila>): Fila[] {
  return rows.map((r) => {
    const out: Fila = {};
    let razon: Record<string, string> | undefined;
    for (const [k, v] of Object.entries(r)) {
      if (k.endsWith(SUFIJO_NULL)) {
        if (v !== null && v !== undefined) (razon ??= {})[k.slice(0, -SUFIJO_NULL.length)] = String(v);
      } else out[k] = v;
    }
    if (razon) out.razon_nulo = razon;
    return out;
  });
}

/** Signos convencionales presentes en las columnas `_null` (filas crudas, sin limpiar) y en `observaciones`. */
export function signosEnFilas(rows: ReadonlyArray<Fila>): Record<string, string> {
  const found: Record<string, string> = {};
  const probar = (v: unknown) => {
    if (typeof v !== "string") return;
    const t = v.trim();
    const meaning = SIGNOS_CONVENCIONALES[t];
    if (meaning && !(t in found)) found[t] = meaning;
  };
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      if (k.endsWith(SUFIJO_NULL) || k === "observaciones") probar(v);
    }
  }
  return found;
}

/** Textos distintos de `observaciones` (ej. "Dato provisorio"), para informarlos junto a los datos. */
export function notasEnFilas(rows: ReadonlyArray<Fila>, max = 5): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const o = r.observaciones;
    if (typeof o === "string" && o.trim() && !(o.trim() in SIGNOS_CONVENCIONALES)) set.add(o.trim());
    if (set.size >= max) break;
  }
  return [...set];
}
