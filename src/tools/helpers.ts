import { z } from "zod";
import { IndecApiError, InputError } from "../client/errors.js";
import type { IndecClient, QueryResult, Row } from "../client/client.js";
import { OPERATORS, getDataset, type Filter, type OrderTerm } from "../client/query.js";
import { DATASETS } from "../datasets/registry.generated.js";
import type { DatasetDef } from "../datasets/types.js";
import { normalizarPeriodo } from "../domain/periodos.js";
import { limpiarFilas, notasEnFilas, signosEnFilas } from "../domain/filas.js";

export const FUENTE_CORTA = "INDEC — api.indec.gob.ar (acceso no oficial)";

export const datasetIds = DATASETS.map((d) => d.id) as [string, ...string[]];
export const datasetEnum = z.enum(datasetIds);

export const filterSchema = z.object({
  column: z.string().describe("Nombre exacto de la columna (distingue mayúsculas; ver indec_describe_dataset)."),
  op: z.enum(OPERATORS).describe("eq, neq, gt, gte, lt, lte, like, ilike (usar * como comodín), in (value = lista), is (value = null/true/false)."),
  value: z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.union([z.string(), z.number()]))]),
});

export const orderSchema = z.object({ column: z.string(), dir: z.enum(["asc", "desc"]).optional() });

export type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

export function ok(payload: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}

export function fail(e: unknown): ToolResult {
  let text: string;
  if (e instanceof IndecApiError) text = e.toUserMessage();
  else if (e instanceof InputError) text = `Parámetros inválidos: ${e.message}`;
  else text = `Error inesperado: ${e instanceof Error ? e.message : String(e)}`;
  return { content: [{ type: "text", text }], isError: true };
}

/** Envuelve un handler para convertir excepciones en respuestas de error MCP. */
export function safe<A>(fn: (args: A) => Promise<ToolResult>): (args: A) => Promise<ToolResult> {
  return async (args) => {
    try {
      return await fn(args);
    } catch (e) {
      return fail(e);
    }
  };
}

export const SOLO_LECTURA = { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: true } as const;

/** Formato estándar de respuesta con filas (limpia las columnas `_null` y expone signos y notas). */
export function dataPayload(ds: DatasetDef, r: QueryResult, extra: Record<string, unknown> = {}) {
  const signos = signosEnFilas(r.rows);
  const notas = notasEnFilas(r.rows);
  return {
    dataset: ds.id,
    ...extra,
    filas: r.rows.length,
    total: r.total,
    siguiente_offset: r.nextOffset,
    ...(Object.keys(signos).length ? { signos_convencionales: signos } : {}),
    ...(notas.length ? { notas } : {}),
    datos: limpiarFilas(r.rows),
    fuente: FUENTE_CORTA,
  };
}

/** Filtro por tipo de indicador en los datasets de precios (IPC, salarios, SIPM, ICC): códigos reales de la API. */
export const TIPOS_PRECIO = ["indice", "mensual", "interanual", "acumulada", "incidencia", "precio_promedio"] as const;
export type TipoPrecio = (typeof TIPOS_PRECIO)[number];

export function filtroTipoPrecio(tipo: TipoPrecio | undefined): Filter[] {
  switch (tipo) {
    case undefined:
      return [];
    case "indice":
      return [{ column: "tipo_de_indicador", op: "eq", value: "Indice" }];
    case "mensual":
      return [{ column: "tipo_de_indicador", op: "eq", value: "v_m" }];
    case "interanual":
      return [{ column: "tipo_de_indicador", op: "eq", value: "v_ia" }];
    case "acumulada":
      return [{ column: "tipo_de_indicador", op: "eq", value: "v_acum" }];
    case "incidencia":
      return [{ column: "tipo_de_indicador", op: "ilike", value: "*incidencia*" }];
    case "precio_promedio":
      return [{ column: "tipo_de_indicador", op: "eq", value: "Precio promedio" }];
  }
}

export const ilikeContains = (column: string, texto: string): Filter => ({ column, op: "ilike", value: `*${texto}*` });

/** Último período disponible del dataset, dados los filtros (null si no hay datos). */
export async function ultimoPeriodo(client: IndecClient, ds: DatasetDef, filters: Filter[]): Promise<string | null> {
  const col = ds.columnaPeriodo;
  if (!col) return null;
  const r = await client.query({ dataset: ds.id, select: [col], filters, order: [{ column: col, dir: "desc" }], limit: 1 });
  const v = r.rows[0]?.[col];
  return v === undefined || v === null ? null : String(v);
}

export interface SerieOpts {
  dataset: string;
  filters?: Filter[];
  desde?: string | undefined;
  hasta?: string | undefined;
  orden?: "asc" | "desc" | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  columnas?: string[] | undefined;
  /** Si no hay desde/hasta, usar este período en vez del último disponible. */
  periodoPorDefecto?: string | undefined;
}

/**
 * Consulta una tabla con columna de período. Sin desde/hasta devuelve solo el último período disponible,
 * para no inundar al agente con toda la serie histórica.
 */
export async function consultarSerie(client: IndecClient, o: SerieOpts) {
  const ds = getDataset(o.dataset);
  const filters = [...(o.filters ?? [])];
  const pc = ds.columnaPeriodo;
  let aplicado: string | undefined;

  if (pc) {
    const d = o.desde ? normalizarPeriodo(ds.frecuencia, o.desde, "desde") : undefined;
    const h = o.hasta ? normalizarPeriodo(ds.frecuencia, o.hasta, "hasta") : undefined;
    if (d === undefined && h === undefined) {
      const p = o.periodoPorDefecto ?? (await ultimoPeriodo(client, ds, filters));
      if (p) {
        filters.push({ column: pc, op: "eq", value: p });
        aplicado = p;
      }
    } else {
      if (d !== undefined) filters.push({ column: pc, op: "gte", value: d });
      if (h !== undefined) filters.push({ column: pc, op: "lte", value: h });
      aplicado = `${d ?? "…"}–${h ?? "…"}`;
    }
  } else if (o.desde || o.hasta) {
    throw new InputError(`${ds.id} no tiene columna de período; no admite desde/hasta.`);
  }

  const order: OrderTerm[] = pc ? [{ column: pc, dir: o.orden ?? "asc" }] : [];
  const r = await client.query(
    { dataset: ds.id, filters, order, limit: o.limit ?? 50, offset: o.offset ?? 0, ...(o.columnas?.length ? { select: o.columnas } : {}) },
    { count: true },
  );
  const sinResultados = r.rows.length === 0 && (o.offset ?? 0) === 0
    ? { aviso: "Sin resultados. Revisá los filtros: usá indec_distinct_values para ver los valores exactos de cada columna." }
    : {};
  return dataPayload(ds, r, { periodo_aplicado: aplicado ?? null, frecuencia: ds.frecuencia, ...sinResultados });
}

/** Parámetros comunes de las tools de series de tiempo. */
export const serieShape = {
  desde: z.string().optional().describe("Inicio del rango: AAAA, AAAA-MM, AAAAMM (según frecuencia del dataset). Sin desde/hasta se devuelve solo el último período disponible."),
  hasta: z.string().optional().describe("Fin del rango (mismos formatos que 'desde')."),
  orden: z.enum(["asc", "desc"]).default("asc").describe("Orden cronológico de las filas."),
  limit: z.number().int().min(1).max(1000).default(50).describe("Filas por página (máx. 1000)."),
  offset: z.number().int().min(0).default(0).describe("Para paginar: usar siguiente_offset de la respuesta anterior."),
  columnas: z.array(z.string()).optional().describe("Columnas a devolver (select). Por defecto todas."),
};

export type { QueryResult, Row };
export { getDataset };
