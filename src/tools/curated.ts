import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { IndecClient } from "../client/client.js";
import { InputError } from "../client/errors.js";
import { getDataset, type Filter } from "../client/query.js";
import { agregar } from "../domain/agregar.js";
import { signosEnFilas } from "../domain/filas.js";
import { normalizarPeriodo } from "../domain/periodos.js";
import { NOTA_REDONDEO } from "../domain/signos.js";
import {
  FUENTE_CORTA,
  SOLO_LECTURA,
  TIPOS_PRECIO,
  consultarSerie,
  filtroTipoPrecio,
  ilikeContains,
  ok,
  safe,
  serieShape,
  ultimoPeriodo,
  type TipoPrecio,
} from "./helpers.js";

type Serie = {
  desde?: string | undefined;
  hasta?: string | undefined;
  orden: "asc" | "desc";
  limit: number;
  offset: number;
  columnas?: string[] | undefined;
};

const txt = (d: string) => z.string().optional().describe(d);
const CONTIENE = " Texto parcial, sin distinguir mayúsculas pero sí tildes.";

const tipoPrecio = (permitidos: readonly TipoPrecio[]) =>
  z
    .enum(permitidos as unknown as [TipoPrecio, ...TipoPrecio[]])
    .optional()
    .describe(
      "Tipo de indicador: indice (nivel), mensual (var. % mensual), interanual (var. % vs. mismo mes del año anterior), acumulada (var. % acumulada del año)" +
        (permitidos.includes("incidencia") ? ", incidencia (puntos porcentuales)" : "") +
        (permitidos.includes("precio_promedio") ? ", precio_promedio (precios de productos)" : "") +
        ". Sin tipo se devuelven todos.",
    );

/** Agrega filtros ilike a partir de pares [columna, texto]. */
function likes(pairs: Array<[string, string | undefined]>): Filter[] {
  return pairs.filter((p): p is [string, string] => Boolean(p[1])).map(([c, t]) => ilikeContains(c, t));
}

const SERIE_IPI = { original: "*original*", desestacionalizada: "*desestacionalizada*", "tendencia-ciclo": "*tendencia-ciclo*" } as const;
const TIPO_IPI: Record<string, string> = {
  indice: "Índice",
  mensual: "Variación intermensual",
  interanual: "Variación interanual",
  acumulada: "Variación acumulada interanual",
  unidades_fisicas: "Unidades físicas",
};

export function registerCuratedTools(server: McpServer, client: IndecClient): void {
  // ───────────── Precios ─────────────
  server.registerTool(
    "indec_ipc",
    {
      title: "IPC — Índice de Precios al Consumidor",
      description:
        "Inflación (IPC, base dic-2016=100) con aperturas por región, nivel (Nivel General, División, Grupo, Clase, Categoría, Producto) y categoría, desde dic-2016. " +
        "Sin desde/hasta devuelve el último mes publicado. Ej.: inflación mensual nacional = region 'Nacional', nivel 'Nivel General', tipo 'mensual'. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        region: txt("Región: Nacional, GBA, Pampeana, Noreste, Noroeste, Cuyo o Patagonia." + CONTIENE),
        nivel: txt("Nivel de desagregación: 'Nivel General', 'División', 'Grupo', 'Clase', 'Categoría' o 'Producto'." + CONTIENE),
        categoria: txt("Descripción de la categoría (ej. 'Alimentos y bebidas no alcohólicas', 'Transporte')." + CONTIENE),
        tipo: tipoPrecio(TIPOS_PRECIO),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { region?: string | undefined; nivel?: string | undefined; categoria?: string | undefined; tipo?: TipoPrecio | undefined } & Serie) => {
      const { region, nivel, categoria, tipo, ...rest } = a;
      return ok(await consultarSerie(client, { dataset: "ipc_nacional", filters: [...likes([["region", region], ["nivel", nivel], ["descripcion", categoria]]), ...filtroTipoPrecio(tipo)], ...rest }));
    }),
  );

  server.registerTool(
    "indec_canastas",
    {
      title: "Canastas básicas (CBA/CBT) y canasta de crianza",
      description:
        "Valorización mensual de la Canasta Básica Alimentaria (CBA) y Total (CBT) del GBA, por adulto equivalente y por hogar tipo (desde 2016), con su variación; o la canasta de crianza por tramo de edad (desde 2020). " +
        "Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        canasta: z.enum(["cba_cbt", "crianza"]).default("cba_cbt"),
        descripcion: txt("Solo cba_cbt: 'Canasta Basica Alimentaria', 'Canasta Basica Total', 'Hogar 1/2/3' o 'Inversa del coeficiente de Engel' (sin tildes)." + CONTIENE),
        tipo: tipoPrecio(["mensual", "interanual"]),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { canasta: "cba_cbt" | "crianza"; descripcion?: string | undefined; tipo?: TipoPrecio | undefined } & Serie) => {
      const { canasta, descripcion, tipo, ...rest } = a;
      const crianza = canasta === "crianza";
      if (crianza && (descripcion || tipo)) throw new InputError("descripcion y tipo aplican solo a cba_cbt.");
      return ok(
        await consultarSerie(client, {
          dataset: crianza ? "canasta-crianza" : "valorizacion_canastas_cba_cbt",
          filters: crianza ? [] : [...likes([["descripcion", descripcion]]), ...filtroTipoPrecio(tipo)],
          ...rest,
        }),
      );
    }),
  );

  server.registerTool(
    "indec_salarios",
    {
      title: "Índice de salarios",
      description: "Índice de salarios (base oct-2016=100) del sector privado registrado, no registrado y público, con variaciones (desde nov-2015). Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        descripcion: txt("Sector: 'Nivel general', 'Sector privado registrado', 'Total no registrado', 'Total registrado', 'Sector público', 'Subsector público nacional/provincial'." + CONTIENE),
        tipo: tipoPrecio(["indice", "mensual", "interanual", "acumulada"]),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { descripcion?: string | undefined; tipo?: TipoPrecio | undefined } & Serie) => {
      const { descripcion, tipo, ...rest } = a;
      return ok(await consultarSerie(client, { dataset: "indice_salarios", filters: [...likes([["descripcion", descripcion]]), ...filtroTipoPrecio(tipo)], ...rest }));
    }),
  );

  server.registerTool(
    "indec_precios_mayoristas",
    {
      title: "Precios mayoristas (SIPM: IPIM, IPIB, IPP)",
      description: "Sistema de índices de precios mayoristas: IPIM, IPIB e IPP, con índice, variaciones e incidencias (desde dic-2015). Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        indicador: txt("'IPIM', 'IPIB' o 'IPP'." + CONTIENE),
        descripcion: txt("Apertura/producto (ej. 'Nivel general', 'Productos primarios')." + CONTIENE),
        tipo: tipoPrecio(["indice", "mensual", "interanual", "acumulada", "incidencia"]),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { indicador?: string | undefined; descripcion?: string | undefined; tipo?: TipoPrecio | undefined } & Serie) => {
      const { indicador, descripcion, tipo, ...rest } = a;
      return ok(await consultarSerie(client, { dataset: "sipm_precios_mayoristas", filters: [...likes([["indicador", indicador], ["descripcion", descripcion]]), ...filtroTipoPrecio(tipo)], ...rest }));
    }),
  );

  server.registerTool(
    "indec_costo_construccion",
    {
      title: "Costo de la construcción (ICC) y redeterminación de obras públicas",
      description:
        "ICC del GBA (base 1993, desde nov-2015) o las aperturas ICC/IPIB para redeterminación de precios de contratos de obra pública (Decretos 1295/2002 y 634/2003). Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        fuente: z.enum(["icc", "redeterminacion"]).default("icc"),
        descripcion: txt("Apertura/descripción (ej. 'Nivel general', 'Mano de obra', 'Materiales')." + CONTIENE),
        tipo: tipoPrecio(["indice", "mensual", "interanual", "acumulada"]),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { fuente: "icc" | "redeterminacion"; descripcion?: string | undefined; tipo?: TipoPrecio | undefined } & Serie) => {
      const { fuente, descripcion, tipo, ...rest } = a;
      return ok(
        await consultarSerie(client, {
          dataset: fuente === "icc" ? "icc_precios_construccion" : "redeterminacion_precios_contratos_obras_publicas",
          filters: [...likes([["descripcion", descripcion]]), ...filtroTipoPrecio(tipo)],
          ...rest,
        }),
      );
    }),
  );

  // ───────────── Actividad ─────────────
  server.registerTool(
    "indec_emae",
    {
      title: "EMAE — Estimador Mensual de Actividad Económica",
      description:
        "EMAE base 2004=100, desde 2004. nivel='general': serie original, desestacionalizada y tendencia-ciclo (índice y variaciones). nivel='sectores': por sector de actividad (serie original). " +
        "Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        nivel: z.enum(["general", "sectores"]).default("general"),
        serie: z.enum(["original", "desestacionalizada", "tendencia-ciclo"]).optional().describe("Solo nivel=general."),
        medida: z.enum(["indice", "variacion"]).optional().describe("Solo nivel=general: índice o variación porcentual (mensual/interanual según la serie)."),
        sector: txt("Solo nivel=sectores: descripción del sector (ej. 'Industria manufacturera', 'Comercio')." + CONTIENE),
        tipo: z.enum(["indice", "interanual"]).optional().describe("Solo nivel=sectores."),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { nivel: "general" | "sectores"; serie?: keyof typeof SERIE_IPI | undefined; medida?: "indice" | "variacion" | undefined; sector?: string | undefined; tipo?: "indice" | "interanual" | undefined } & Serie) => {
      const { nivel, serie, medida, sector, tipo, ...rest } = a;
      const general = nivel === "general";
      if (general && (sector || tipo)) throw new InputError("sector y tipo aplican solo a nivel=sectores.");
      if (!general && (serie || medida)) throw new InputError("serie y medida aplican solo a nivel=general.");
      const filters: Filter[] = [];
      if (general) {
        if (serie) filters.push(ilikeContains("tipo_de_indicador_descripcion", `serie ${serie}`));
        if (medida) filters.push({ column: "tipo_de_indicador_descripcion", op: "ilike", value: medida === "indice" ? "Índice*" : "Var %*" });
      } else {
        filters.push(...likes([["descripcion", sector]]));
        if (tipo) filters.push({ column: "tipo_de_indicador", op: "eq", value: tipo === "indice" ? "Índice base 2004=100" : "Variación porcentual interanual" });
      }
      return ok(await consultarSerie(client, { dataset: general ? "estimador-mensual-de-actividad-economica-nivel-general" : "estimador-mensual-de-actividad-economica-sectores", filters, ...rest }));
    }),
  );

  server.registerTool(
    "indec_ipi",
    {
      title: "IPI — Índice de producción industrial (manufacturero y minero)",
      description:
        "IPI manufacturero (base 2004=100, desde 2016) o minero (base 2016=100, desde 2017), con series original, desestacionalizada y tendencia-ciclo. Sin desde/hasta devuelve el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        rama: z.enum(["manufacturero", "minero"]).default("manufacturero"),
        actividad: txt("Descripción de la actividad (ej. 'Nivel general', 'alimentos')." + CONTIENE),
        serie: z.enum(["original", "desestacionalizada", "tendencia-ciclo"]).optional(),
        tipo: z.enum(["indice", "mensual", "interanual", "acumulada", "unidades_fisicas"]).optional().describe("mensual = variación intermensual; acumulada = variación acumulada interanual; unidades_fisicas solo en minero."),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { rama: "manufacturero" | "minero"; actividad?: string | undefined; serie?: keyof typeof SERIE_IPI | undefined; tipo?: string | undefined } & Serie) => {
      const { rama, actividad, serie, tipo, ...rest } = a;
      if (tipo === "unidades_fisicas" && rama !== "minero") throw new InputError("unidades_fisicas solo existe en el IPI minero.");
      const filters: Filter[] = likes([["descripcion", actividad]]);
      if (serie) filters.push({ column: "serie", op: "ilike", value: SERIE_IPI[serie] });
      if (tipo) filters.push({ column: "tipo_de_indicador", op: "eq", value: TIPO_IPI[tipo]! });
      return ok(await consultarSerie(client, { dataset: rama === "minero" ? "ipi_minero" : "ipi_manufacturero", filters, ...rest }));
    }),
  );

  // ───────────── Condiciones de vida ─────────────
  server.registerTool(
    "indec_pobreza",
    {
      title: "Pobreza e indigencia (EPH)",
      description:
        "Incidencia de pobreza e indigencia en hogares y personas, total de 31 aglomerados urbanos, semestral desde el 2.º semestre de 2016 (períodos tipo '20261S'). " +
        "desde/hasta aceptan AAAA o AAAA-N (N = semestre 1 o 2). Sin desde/hasta devuelve el último semestre publicado. Requiere INDEC_API_TOKEN.",
      inputSchema: { area: txt("Área geográfica (hoy solo 'T_31_A' = total 31 aglomerados)." + CONTIENE), ...serieShape },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { area?: string | undefined } & Serie) => {
      const { area, ...rest } = a;
      return ok(await consultarSerie(client, { dataset: "pobreza_eph", filters: likes([["area_geografica_nom", area]]), ...rest }));
    }),
  );

  server.registerTool(
    "indec_mercado_trabajo",
    {
      title: "Mercado de trabajo (EPH)",
      description:
        "Tasas de actividad, empleo, empleo formal/informal, desocupación y subocupación (31 aglomerados), trimestral desde el 2.º trimestre de 2016 (períodos tipo '20262T'). " +
        "desde/hasta aceptan AAAA o AAAA-N (N = trimestre 1–4). Sin desde/hasta devuelve el último trimestre publicado. Requiere INDEC_API_TOKEN.",
      inputSchema: { area: txt("Área geográfica (hoy solo 'T_31_A' = total 31 aglomerados)." + CONTIENE), ...serieShape },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { area?: string | undefined } & Serie) => {
      const { area, ...rest } = a;
      return ok(await consultarSerie(client, { dataset: "mercado_trabajo_eph", filters: likes([["area_geografica_nom", area]]), ...rest }));
    }),
  );

  // ───────────── Población ─────────────
  server.registerTool(
    "indec_poblacion",
    {
      title: "Población: estimaciones y proyecciones (Censo 2022)",
      description:
        "Población al 1.º de julio de cada año. nivel='nacional' (por sexo y edad simple, 2022–2040), 'jurisdiccion' (por sexo y grupo quinquenal de edad, 2022–2040) o 'departamento' (por sexo, 2022–2035). " +
        "desde/hasta son años. Sin desde/hasta usa el año en curso (acotado al rango del dataset). Requiere INDEC_API_TOKEN.",
      inputSchema: {
        nivel: z.enum(["nacional", "jurisdiccion", "departamento"]).default("nacional"),
        jurisdiccion: txt("Nombre de la provincia/jurisdicción (niveles jurisdiccion y departamento)." + CONTIENE),
        departamento: txt("Nombre del departamento/partido (nivel departamento)." + CONTIENE),
        sexo: txt("Sexo: 'Mujer' o 'Varon' (sin tilde)." + CONTIENE),
        edad: txt("Nacional: edad en años (número exacto). Jurisdicción: texto del grupo quinquenal (ej. '20 a 24', '100 y más')."),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { nivel: "nacional" | "jurisdiccion" | "departamento"; jurisdiccion?: string | undefined; departamento?: string | undefined; sexo?: string | undefined; edad?: string | undefined } & Serie) => {
      const { nivel, jurisdiccion, departamento, sexo, edad, ...rest } = a;
      const dataset = { nacional: "proyecciones_poblacion_nacional_2022_2040", jurisdiccion: "proyecciones_poblacion_jurisdiccion_2022_2040", departamento: "estimaciones_poblacion_departamento_2022_2035" }[nivel];
      const filters: Filter[] = [];
      if (nivel !== "nacional") filters.push(...likes([["jurisdiccion_nom", jurisdiccion]]));
      else if (jurisdiccion) throw new InputError("nivel=nacional no admite 'jurisdiccion'.");
      if (nivel === "departamento") filters.push(...likes([["departamento_nom", departamento]]));
      else if (departamento) throw new InputError("'departamento' solo aplica a nivel=departamento.");
      filters.push(...likes([["sexo_nom", sexo]]));
      if (edad) {
        if (nivel === "nacional") {
          if (!/^\d+$/.test(edad)) throw new InputError("En nivel nacional 'edad' debe ser un número entero de años.");
          filters.push({ column: "edad", op: "eq", value: Number(edad) });
        } else if (nivel === "jurisdiccion") filters.push(ilikeContains("edad_nom", edad));
        else throw new InputError("El nivel departamento no tiene apertura por edad.");
      }
      const [min, max] = nivel === "departamento" ? [2022, 2035] : [2022, 2040];
      const anio = String(Math.min(max, Math.max(min, new Date().getFullYear())));
      return ok(await consultarSerie(client, { dataset, filters, periodoPorDefecto: anio, ...rest }));
    }),
  );

  // ───────────── Sector externo ─────────────
  registerComercioExterior(server, client);
}

// ───────────────────────── Comercio exterior ─────────────────────────

/** Tope de filas a recorrer en el modo agregado (≈ 200 páginas de 1000). Exportaciones tiene ~780 mil filas en total. */
const MAX_FILAS_AGREGADO = 200_000;

type DimNomen ="pais" | "rubro" | "subrubro" | "uso_economico" | "gce";
/** Columna `nombre_columna` de comercio_exterior_nomenclaturas (verificada contra la API real). */
const COL_NOMEN: Record<DimNomen, string> = {
  pais: "pais_cod",
  rubro: "rubro_cod",
  subrubro: "subrubro_cod",
  uso_economico: "uso_economico_cod",
  gce: "gce_cod",
};

/** Códigos y descripciones de comercio exterior (325 filas; la caché del cliente evita repetir la consulta). */
async function cargarNomenclaturas(client: IndecClient) {
  const { rows } = await client.queryAll({ dataset: "comercio_exterior_nomenclaturas" }, 5000);
  return rows.map((r) => ({ columna: String(r.nombre_columna ?? ""), codigo: String(r.codigo ?? ""), descripcion: String(r.codigo_descripcion ?? "") }));
}

type Nomen = Awaited<ReturnType<typeof cargarNomenclaturas>>;
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const esDe = (n: Nomen[number], dim: DimNomen) => n.columna === COL_NOMEN[dim];

function registerComercioExterior(server: McpServer, client: IndecClient): void {
  server.registerTool(
    "indec_buscar_codigo",
    {
      title: "Buscar códigos de comercio exterior",
      description:
        "Busca en el diccionario de comercio exterior (países, rubros, subrubros, usos económicos, grandes categorías económicas) por texto de la descripción (sin distinguir tildes) o por código. " +
        "Útil para traducir 'Brasil' → código de país, o un código → nombre. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        texto: txt("Texto a buscar en la descripción (ej. 'Brasil', 'cereales')."),
        codigo: txt("Código exacto a traducir."),
        tipo: z.enum(["pais", "rubro", "subrubro", "uso_economico", "gce"]).optional().describe("Acotar a un tipo de código."),
        limit: z.number().int().min(1).max(500).default(50),
      },
      annotations: SOLO_LECTURA,
    },
    safe(async (a: { texto?: string | undefined; codigo?: string | undefined; tipo?: DimNomen | undefined; limit: number }) => {
      if (!a.texto && !a.codigo && !a.tipo) throw new InputError("Indicá al menos texto, codigo o tipo.");
      const todo = await cargarNomenclaturas(client);
      const t = a.texto ? norm(a.texto) : undefined;
      const hits = todo
        .filter((n) => (!a.tipo || esDe(n, a.tipo)) && (!a.codigo || n.codigo === a.codigo) && (!t || norm(n.descripcion).includes(t)))
        .slice(0, a.limit);
      return ok({ cantidad: hits.length, resultados: hits, fuente: FUENTE_CORTA });
    }),
  );

  server.registerTool(
    "indec_comercio_exterior",
    {
      title: "Comercio exterior de bienes (exportaciones / importaciones)",
      description:
        "Exportaciones (valor FOB; rubros y subrubros) o importaciones (valor CIF; usos económicos y grandes categorías) por país, mensual desde 1986. Valores en USD y peso neto en kg. " +
        "Filtrá por nombre (se resuelve contra el diccionario). Con agrupar_por devuelve totales sumados con nombres en vez de filas crudas (las filas con dato confidencial 's' no suman y se informan). " +
        "desde/hasta aceptan AAAA o AAAA-MM; sin ellos se usa el último mes. Requiere INDEC_API_TOKEN.",
      inputSchema: {
        flujo: z.enum(["exportaciones", "importaciones"]),
        pais: txt("Nombre del país (ej. 'Brasil')." + " Sin distinguir tildes."),
        rubro: txt("Solo exportaciones: rubro (ej. 'productos primarios', 'manufacturas de origen industrial')."),
        subrubro: txt("Solo exportaciones: subrubro (ej. 'cereales')."),
        uso_economico: txt("Solo importaciones: uso económico (ej. 'bienes de capital', 'bienes intermedios')."),
        gce: txt("Solo importaciones: gran categoría económica."),
        agrupar_por: z.enum(["anio", "periodo", "pais", "rubro", "subrubro", "uso_economico", "gce"]).optional().describe("Sumar valor y peso por esta dimensión."),
        ...serieShape,
      },
      annotations: SOLO_LECTURA,
    },
    safe(
      async (
        a: {
          flujo: "exportaciones" | "importaciones";
          pais?: string | undefined;
          rubro?: string | undefined;
          subrubro?: string | undefined;
          uso_economico?: string | undefined;
          gce?: string | undefined;
          agrupar_por?: "anio" | "periodo" | "pais" | "rubro" | "subrubro" | "uso_economico" | "gce" | undefined;
        } & Serie,
      ) => {
        const exp = a.flujo === "exportaciones";
        const dataset = exp ? "comercio_exterior_exportacion_bienes" : "comercio_exterior_importacion_bienes";
        const col: Record<string, string> = exp
          ? { anio: "Anio", periodo: "Periodo", pais: "pais_cod", rubro: "rubro_cod", subrubro: "subrubro_cod", valor: "valor_FOB", peso: "Peso_Neto" }
          : { anio: "Anio", periodo: "Periodo", pais: "pais_cod", uso_economico: "uso_economico_cod", gce: "gce_cod", valor: "valor_CIF", peso: "peso_neto" };

        const soloExp = [a.rubro, a.subrubro, a.agrupar_por === "rubro" || a.agrupar_por === "subrubro" ? "x" : undefined];
        const soloImp = [a.uso_economico, a.gce, a.agrupar_por === "uso_economico" || a.agrupar_por === "gce" ? "x" : undefined];
        if (exp && soloImp.some(Boolean)) throw new InputError("uso_economico y gce aplican solo a importaciones.");
        if (!exp && soloExp.some(Boolean)) throw new InputError("rubro y subrubro aplican solo a exportaciones.");

        const needNomen = Boolean(a.pais || a.rubro || a.subrubro || a.uso_economico || a.gce || ["pais", "rubro", "subrubro", "uso_economico", "gce"].includes(a.agrupar_por ?? ""));
        const nomen: Nomen = needNomen ? await cargarNomenclaturas(client) : [];
        const resueltos: Record<string, string[]> = {};
        const filters: Filter[] = [];
        const resolver = (texto: string | undefined, dim: DimNomen) => {
          if (!texto) return;
          const t = norm(texto);
          const cand = nomen.filter((n) => esDe(n, dim));
          // Si hay coincidencia exacta de nombre se usa solo esa ("China" ≠ "Hong Kong Región Administrativa Especial de (China)").
          const exactas = cand.filter((n) => norm(n.descripcion) === t);
          const m = exactas.length ? exactas : cand.filter((n) => norm(n.descripcion).includes(t));
          if (!m.length) throw new InputError(`No encontré "${texto}" entre los códigos de ${dim}. Probá con indec_buscar_codigo.`);
          filters.push({ column: col[dim]!, op: "in", value: [...new Set(m.map((n) => n.codigo))] });
          resueltos[dim] = m.slice(0, 10).map((n) => `${n.codigo}=${n.descripcion}`);
        };
        resolver(a.pais, "pais");
        resolver(a.rubro, "rubro");
        resolver(a.subrubro, "subrubro");
        resolver(a.uso_economico, "uso_economico");
        resolver(a.gce, "gce");

        const { agrupar_por, pais: _p, rubro: _r, subrubro: _s, uso_economico: _u, gce: _g, flujo: _f, ...rest } = a;
        if (!agrupar_por) {
          const payload = await consultarSerie(client, { dataset, filters, ...rest });
          return ok({ ...payload, filtros_resueltos: resueltos });
        }

        // Modo agregado: se recorren las filas del rango y se suman localmente.
        const ds = getDataset(dataset);
        const periodoCol = ds.columnaPeriodo!;
        const f = [...filters];
        if (a.desde || a.hasta) {
          if (a.desde) f.push({ column: periodoCol, op: "gte", value: normalizarPeriodo("mensual", a.desde, "desde") });
          if (a.hasta) f.push({ column: periodoCol, op: "lte", value: normalizarPeriodo("mensual", a.hasta, "hasta") });
        } else {
          const p = await ultimoPeriodo(client, ds, f);
          if (p) f.push({ column: periodoCol, op: "eq", value: p });
        }
        const dim = col[agrupar_por]!;
        const select = [...new Set([dim, col.valor!, `${col.valor}_null`, col.peso!])];
        const { rows, truncated, total } = await client.queryAll({ dataset, select, filters: f }, MAX_FILAS_AGREGADO);
        const sumV = agregar(rows, [dim], col.valor, "sum");
        const sumP = new Map(agregar(rows, [dim], col.peso, "sum").map((g) => [String(g.grupo[dim]), g.valor]));
        const etiquetable = ["pais", "rubro", "subrubro", "uso_economico", "gce"].includes(agrupar_por);
        const etiqueta = (code: string) => (etiquetable ? nomen.find((n) => n.codigo === code && esDe(n, agrupar_por as DimNomen))?.descripcion : undefined);
        const claveValor = exp ? "valor_fob_usd" : "valor_cif_usd";
        const grupos = sumV
          .map((g) => {
            const code = String(g.grupo[dim]);
            return {
              [agrupar_por]: code,
              descripcion: etiqueta(code) ?? null,
              [claveValor]: g.valor,
              peso_neto_kg: sumP.get(code) ?? null,
              filas: g.n,
              filas_sin_valor: g.n - g.n_numericas,
            };
          })
          .sort((x, y) =>
            agrupar_por === "anio" || agrupar_por === "periodo"
              ? String(x[agrupar_por]).localeCompare(String(y[agrupar_por]))
              : Number(y[claveValor] ?? 0) - Number(x[claveValor] ?? 0),
          );
        const sinValor = grupos.reduce((s, g) => s + g.filas_sin_valor, 0);
        const signos = signosEnFilas(rows);
        return ok({
          dataset,
          agrupado_por: agrupar_por,
          filtros_resueltos: resueltos,
          filas_procesadas: rows.length,
          total_filas_filtradas: total,
          incompleto: truncated,
          cantidad_grupos: grupos.length,
          grupos: grupos.slice(0, a.limit),
          ...(sinValor ? { filas_sin_valor: sinValor, aviso_sin_valor: "Hay filas sin valor numérico (confidenciales 's' u otras): no suman, por lo que los totales pueden estar subestimados." } : {}),
          ...(Object.keys(signos).length ? { signos_convencionales: signos } : {}),
          nota: NOTA_REDONDEO,
          fuente: FUENTE_CORTA,
        });
      },
    ),
  );
}
