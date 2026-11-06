import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { IndecClient } from "../client/client.js";
import { MAX_PAGE_SIZE, getDataset, listDatasets, type Filter } from "../client/query.js";
import { SPEC_META } from "../datasets/registry.generated.js";
import { agregar, aNumero } from "../domain/agregar.js";
import { signosEnFilas } from "../domain/filas.js";
import { FUENTE, NOTA_REDONDEO, SIGNOS_CONVENCIONALES } from "../domain/signos.js";
import { SOLO_LECTURA, datasetEnum, dataPayload, filterSchema, fail, ok, orderSchema, safe, ultimoPeriodo, FUENTE_CORTA } from "./helpers.js";

const primeraOracion = (s: string, max = 240) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
};

export function registerGenericTools(server: McpServer, client: IndecClient): void {
  server.registerTool(
    "indec_list_datasets",
    {
      title: "Listar datasets del INDEC",
      description:
        "Lista el catálogo de los datasets de la API del INDEC (id, área, frecuencia y resumen). Empezá por acá para saber qué datos existen. No consulta datos y no requiere token.",
      inputSchema: { area: z.string().optional().describe("Filtro por texto en el área del INDEC (ej. 'precios', 'población', 'condiciones de vida').") },
      annotations: SOLO_LECTURA,
    },
    safe(async ({ area }: { area?: string | undefined }) => {
      const q = area?.toLowerCase();
      const items = listDatasets()
        .filter((d) => !q || d.area.toLowerCase().includes(q) || d.id.includes(q) || d.titulo.toLowerCase().includes(q))
        .map((d) => ({ id: d.id, titulo: d.titulo, area: d.area, frecuencia: d.frecuencia, resumen: primeraOracion(d.descripcion) }));
      return ok({ total: items.length, datasets: items, fuente: FUENTE });
    }),
  );

  server.registerTool(
    "indec_describe_dataset",
    {
      title: "Describir un dataset",
      description:
        "Devuelve las columnas (nombre exacto, tipo y significado), la clave de orden para paginar y la frecuencia de un dataset. Usalo antes de armar filtros con indec_query_dataset. No requiere token.",
      inputSchema: { dataset: datasetEnum },
      annotations: SOLO_LECTURA,
    },
    safe(async ({ dataset }: { dataset: string }) => {
      const d = getDataset(dataset);
      return ok({
        id: d.id,
        titulo: d.titulo,
        area: d.area,
        descripcion: d.descripcion,
        frecuencia: d.frecuencia,
        columna_periodo: d.columnaPeriodo,
        clave_orden: d.claveOrden,
        columnas: d.columnas.map((c) => ({ nombre: c.name, tipo: c.type, anulable: c.nullable, descripcion: primeraOracion(c.description, 200) })),
        nota:
          "Los nombres de columna distinguen mayúsculas. Cada columna de valor tiene una columna hermana `<columna>_null` (no listada arriba) con el signo convencional cuando el valor es nulo " +
          "(ej. valor_FOB_null='s' = secreto estadístico); se puede usar en select y filtros. Ver recurso indec://signos-convencionales.",
        fuente: FUENTE,
      });
    }),
  );

  server.registerTool(
    "indec_query_dataset",
    {
      title: "Consultar un dataset (genérico)",
      description:
        "Consulta cualquier dataset con select, filtros, orden y paginación (máx. 1000 filas por página). Si no indicás order se usa la clave primaria completa para que la paginación sea estable. " +
        "Con count=true devuelve también el total exacto de filas. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        dataset: datasetEnum,
        select: z.array(z.string()).optional().describe("Columnas a devolver. Por defecto todas."),
        filters: z.array(filterSchema).optional().describe("Filtros combinados con AND."),
        order: z.array(orderSchema).optional(),
        limit: z.number().int().min(1).max(MAX_PAGE_SIZE).default(100),
        offset: z.number().int().min(0).default(0),
        count: z.boolean().default(true).describe("Pedir el total exacto de filas."),
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { dataset: string; select?: string[] | undefined; filters?: Filter[] | undefined; order?: { column: string; dir?: "asc" | "desc" | undefined }[] | undefined; limit: number; offset: number; count: boolean }) => {
      const ds = getDataset(a.dataset);
      const r = await client.query(
        { dataset: a.dataset, ...(a.select ? { select: a.select } : {}), ...(a.filters ? { filters: a.filters } : {}), ...(a.order ? { order: a.order } : {}), limit: a.limit, offset: a.offset },
        { count: a.count },
      );
      return ok(dataPayload(ds, r));
    }),
  );

  server.registerTool(
    "indec_count_rows",
    {
      title: "Contar filas de un dataset",
      description: "Devuelve el total exacto de filas de un dataset (opcionalmente filtrado) sin traer datos. Requiere INDEC_API_TOKEN.",
      inputSchema: { dataset: datasetEnum, filters: z.array(filterSchema).optional() },
      annotations: SOLO_LECTURA,
    },
    safe(async ({ dataset, filters }: { dataset: string; filters?: Filter[] | undefined }) => {
      const ds = getDataset(dataset);
      const r = await client.query({ dataset, select: [ds.claveOrden[0]!], ...(filters ? { filters } : {}), limit: 1 }, { count: true });
      return ok({ dataset, total: r.total, fuente: FUENTE_CORTA });
    }),
  );

  server.registerTool(
    "indec_distinct_values",
    {
      title: "Valores distintos de una columna",
      description:
        "Lista los valores distintos de una columna (útil para descubrir regiones, rubros, sectores, etc. antes de filtrar). " +
        "Por defecto mira solo el último período disponible (donde suelen estar todas las categorías); con all_periods=true recorre hasta max_rows filas. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        dataset: datasetEnum,
        column: z.string().describe("Columna a explorar."),
        filters: z.array(filterSchema).optional(),
        all_periods: z.boolean().default(false),
        max_rows: z.number().int().min(1).max(20000).default(5000),
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { dataset: string; column: string; filters?: Filter[] | undefined; all_periods: boolean; max_rows: number }) => {
      const ds = getDataset(a.dataset);
      const filters = [...(a.filters ?? [])];
      let periodo: string | null = null;
      if (!a.all_periods && ds.columnaPeriodo) {
        periodo = await ultimoPeriodo(client, ds, filters);
        if (periodo) filters.push({ column: ds.columnaPeriodo, op: "eq", value: periodo });
      }
      const { rows, truncated } = await client.queryAll({ dataset: a.dataset, select: [a.column], filters, order: [{ column: a.column }] }, a.max_rows);
      const counts = new Map<string, number>();
      for (const r of rows) {
        const k = String(r[a.column] ?? "null");
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      const valores = [...counts.keys()].sort((x, y) => x.localeCompare(y, "es"));
      return ok({ dataset: a.dataset, columna: a.column, periodo_explorado: periodo, cantidad: valores.length, valores, incompleto: truncated, fuente: FUENTE_CORTA });
    }),
  );

  server.registerTool(
    "indec_aggregate",
    {
      title: "Agregar datos (suma, promedio, mín., máx., conteo)",
      description:
        "Trae las filas que cumplen el filtro (hasta max_rows, paginando de a 1000) y las agrupa localmente por una o más columnas. " +
        "Sirve para totales como 'exportaciones por año' o 'población por jurisdicción'. Ojo: sumar índices o tasas no tiene sentido estadístico; usar sobre magnitudes (USD, kg, habitantes). Requiere INDEC_API_TOKEN.",
      inputSchema: {
        dataset: datasetEnum,
        filters: z.array(filterSchema).optional(),
        group_by: z.array(z.string()).default([]).describe("Columnas de agrupación. Vacío = un único total."),
        value_column: z.string().optional().describe("Columna numérica a agregar (no hace falta con agg='count')."),
        agg: z.enum(["sum", "avg", "min", "max", "count"]).default("sum"),
        max_rows: z.number().int().min(1).max(50000).default(20000).describe("Tope de filas a recorrer (máximo 50.000, para no saturar la API del INDEC)."),
        max_groups: z.number().int().min(1).max(500).default(100).describe("Tope de grupos devueltos (ordenados por valor desc)."),
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { dataset: string; filters?: Filter[] | undefined; group_by: string[]; value_column?: string | undefined; agg: "sum" | "avg" | "min" | "max" | "count"; max_rows: number; max_groups: number }) => {
      const ds = getDataset(a.dataset);
      // Se pide también la columna hermana `<valor>_null` para detectar datos suprimidos/confidenciales.
      // Toda columna anulable del spec tiene su hermana `<col>_null` (verificado contra la API real).
      const tieneNull = a.value_column ? ds.columnas.find((c) => c.name === a.value_column)?.nullable === true : false;
      const select = [...new Set([...a.group_by, ...(a.value_column ? [a.value_column, ...(tieneNull ? [`${a.value_column}_null`] : [])] : [])])];
      const { rows, total, truncated } = await client.queryAll(
        { dataset: a.dataset, ...(select.length ? { select } : {}), ...(a.filters ? { filters: a.filters } : {}), order: a.group_by.map((column) => ({ column })) },
        a.max_rows,
      );
      const grupos = agregar(rows, a.group_by, a.value_column, a.agg).sort((x, y) => (y.valor ?? -Infinity) - (x.valor ?? -Infinity));
      const signos = signosEnFilas(rows);
      const sinValor = a.value_column ? rows.filter((r) => aNumero(r[a.value_column!]) === null).length : 0;
      return ok({
        dataset: ds.id,
        agg: a.agg,
        value_column: a.value_column ?? null,
        filas_procesadas: rows.length,
        total_filas_filtradas: total,
        incompleto: truncated,
        ...(truncated ? { aviso: "Se alcanzó max_rows: el resultado es parcial. Acotá los filtros o subí max_rows." } : {}),
        cantidad_grupos: grupos.length,
        grupos: grupos.slice(0, a.max_groups),
        ...(sinValor ? { filas_sin_valor: sinValor, aviso_sin_valor: "Esas filas no tienen valor numérico (suprimidas/confidenciales o no aplican) y NO están incluidas en la suma." } : {}),
        ...(Object.keys(signos).length ? { signos_convencionales: signos } : {}),
        nota: NOTA_REDONDEO,
        fuente: FUENTE_CORTA,
      });
    }),
  );

  server.registerTool(
    "indec_status",
    {
      title: "Estado del servidor y de la API",
      description:
        "Informa si hay token configurado, la URL base y si el spec público de la API del INDEC cambió respecto del que usa este servidor (la API está en BETA). No requiere token.",
      inputSchema: {},
      annotations: SOLO_LECTURA,
    },
    safe(async () => {
      let spec: Record<string, unknown>;
      try {
        const hash = await client.fetchSpecHash();
        spec = { spec_cambio: hash !== SPEC_META.sha256, sha256_remoto: hash.slice(0, 12), sha256_local: SPEC_META.sha256.slice(0, 12) };
      } catch (e) {
        return fail(e);
      }
      return ok({
        token_configurado: client.hasToken,
        datasets: listDatasets().length,
        spec_version: SPEC_META.version,
        ...spec,
        aviso: spec.spec_cambio ? "El spec publicado por el INDEC cambió: conviene regenerar con `npm run gen -- --fetch`." : undefined,
        signos_convencionales: Object.keys(SIGNOS_CONVENCIONALES).length,
      });
    }),
  );
}
