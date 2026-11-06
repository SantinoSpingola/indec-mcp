import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer } from "../src/server.js";
import { makeClient } from "./mock.js";

async function connect(handlers: Parameters<typeof makeClient>[0]) {
  const { client: api, calls } = makeClient(handlers);
  const server = createServer(api);
  const [a, b] = InMemoryTransport.createLinkedPair();
  const mcp = new Client({ name: "test", version: "0" });
  await Promise.all([server.connect(a), mcp.connect(b)]);
  const call = async (name: string, args: Record<string, unknown> = {}) => {
    const r = (await mcp.callTool({ name, arguments: args })) as { content: { text: string }[]; isError?: boolean };
    const text = r.content[0]!.text;
    return { isError: Boolean(r.isError), text, json: r.isError ? null : JSON.parse(text) };
  };
  return { mcp, call, calls };
}

const EXPECTED_TOOLS = [
  "indec_list_datasets", "indec_describe_dataset", "indec_query_dataset", "indec_count_rows", "indec_distinct_values", "indec_aggregate", "indec_status",
  "indec_ipc", "indec_canastas", "indec_salarios", "indec_precios_mayoristas", "indec_costo_construccion", "indec_emae", "indec_ipi",
  "indec_pobreza", "indec_mercado_trabajo", "indec_poblacion", "indec_buscar_codigo", "indec_comercio_exterior",
];

describe("servidor MCP", () => {
  it("expone todas las tools, recursos y prompts", async () => {
    const { mcp } = await connect({});
    const tools = (await mcp.listTools()).tools;
    expect(tools.map((t) => t.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint, t.name).toBe(true);
      expect(t.description?.length, t.name).toBeGreaterThan(20);
    }
    const res = (await mcp.listResources()).resources.map((r) => r.uri);
    expect(res).toContain("indec://catalogo");
    expect(res).toContain("indec://signos-convencionales");
    expect((await mcp.listPrompts()).prompts.length).toBeGreaterThanOrEqual(4);
    const tpl = await mcp.readResource({ uri: "indec://dataset/ipc_nacional" });
    expect(JSON.parse(tpl.contents[0]!.text as string).id).toBe("ipc_nacional");
  });

  it("indec_list_datasets no necesita red y lista los 19", async () => {
    const { call, calls } = await connect({});
    const r = await call("indec_list_datasets");
    expect(r.json.total).toBe(19);
    expect(calls).toHaveLength(0);
    expect((await call("indec_list_datasets", { area: "población" })).json.total).toBe(3);
  });

  it("indec_describe_dataset devuelve columnas y clave de orden", async () => {
    const { call } = await connect({});
    const r = await call("indec_describe_dataset", { dataset: "comercio_exterior_exportacion_bienes" });
    expect(r.json.clave_orden).toEqual(["Anio", "Mes", "Periodo", "rubro_cod", "subrubro_cod", "pais_cod"]);
    expect(r.json.columnas.map((c: { nombre: string }) => c.nombre)).toContain("valor_FOB");
  });

  it("indec_ipc sin fechas busca el último período y filtra por él", async () => {
    const { call, calls } = await connect({
      ipc_nacional: ({ url }) => {
        if (url.searchParams.get("select") === "periodo") return { body: [{ periodo: "202610" }] };
        return { status: 200, body: [{ descripcion: "Nivel general", periodo: "202610", valor: 2.1 }], headers: { "Content-Range": "0-0/1" } };
      },
    });
    const r = await call("indec_ipc", { region: "nacional", nivel: "Nivel General", tipo: "mensual" });
    expect(r.isError).toBe(false);
    expect(r.json).toMatchObject({ dataset: "ipc_nacional", periodo_aplicado: "202610", filas: 1, total: 1 });
    const q = calls[1]!.url.searchParams;
    expect(q.get("periodo")).toBe("eq.202610");
    expect(q.get("region")).toBe("ilike.*nacional*");
    expect(q.get("nivel")).toBe("ilike.*Nivel General*");
    expect(q.get("tipo_de_indicador")).toBe("eq.v_m"); // código real de la API para variación mensual
    expect(q.get("limit")).toBe("50");
  });

  it("indec_ipc con rango usa gte/lte normalizados y no busca el último período", async () => {
    const { call, calls } = await connect({ ipc_nacional: () => ({ body: [] }) });
    await call("indec_ipc", { desde: "2025", hasta: "2025-06" });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url.searchParams.getAll("periodo")).toEqual(["gte.202501", "lte.202506"]);
  });

  it("limpia las columnas _null, informa signos y notas (formato real de la API)", async () => {
    const { call, calls } = await connect({
      ipc_nacional: ({ url }) =>
        url.searchParams.get("select") ? { body: [{ periodo: "202609" }] } : {
          body: [
            { descripcion: "Bienes", periodo: "202609", valor: null, valor_null: "///", observaciones: null },
            { descripcion: "Nivel general", periodo: "202609", valor: 1.9, valor_null: null, observaciones: "Dato provisorio" },
          ],
        },
    });
    const r = await call("indec_ipc");
    expect(calls[1]!.url.searchParams.get("periodo")).toBe("eq.202609");
    expect(r.json.signos_convencionales).toEqual({ "///": "Dato que no corresponde presentar" });
    expect(r.json.notas).toEqual(["Dato provisorio"]);
    expect(r.json.datos[0]).toEqual({ descripcion: "Bienes", periodo: "202609", valor: null, observaciones: null, razon_nulo: { valor: "///" } });
    expect(r.json.datos[1]).not.toHaveProperty("valor_null");
    expect(r.json.datos[1]).not.toHaveProperty("razon_nulo");
  });

  it("indec_pobreza usa el formato de período real (20251S) para rangos", async () => {
    const { call, calls } = await connect({ pobreza_eph: () => ({ body: [] }) });
    const r = await call("indec_pobreza", { desde: "2025", hasta: "2026-1" });
    expect(calls[0]!.url.searchParams.getAll("periodo")).toEqual(["gte.20251S", "lte.20261S"]);
    expect(r.json.aviso).toMatch(/indec_distinct_values/);
  });

  it("indec_query_dataset valida columnas y devuelve errores como isError", async () => {
    const { call } = await connect({ pobreza_eph: () => ({ body: [] }) });
    const bad = await call("indec_query_dataset", { dataset: "pobreza_eph", filters: [{ column: "nope", op: "eq", value: 1 }] });
    expect(bad.isError).toBe(true);
    expect(bad.text).toMatch(/nope/);
  });

  it("un 401 de la API llega al agente con instrucciones para el token", async () => {
    const { call } = await connect({ ipc_nacional: () => ({ status: 401, body: { code: "42501", message: "permission denied for schema api" } }) });
    const r = await call("indec_ipc");
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/INDEC_API_TOKEN/);
  });

  it("indec_distinct_values explora solo el último período", async () => {
    const { call, calls } = await connect({
      ipc_nacional: ({ url }) =>
        url.searchParams.get("select") === "periodo"
          ? { body: [{ periodo: "202610" }] }
          : { body: [{ region: "GBA" }, { region: "Nacional" }, { region: "GBA" }], headers: { "Content-Range": "0-2/3" } },
    });
    const r = await call("indec_distinct_values", { dataset: "ipc_nacional", column: "region" });
    expect(r.json).toMatchObject({ valores: ["GBA", "Nacional"], periodo_explorado: "202610", incompleto: false });
    expect(calls[1]!.url.searchParams.get("periodo")).toBe("eq.202610");
  });

  it("indec_aggregate rechaza un max_rows que saturaría la API (tope 50.000)", async () => {
    const { call } = await connect({});
    const r = await call("indec_aggregate", { dataset: "comercio_exterior_exportacion_bienes", group_by: ["Anio"], max_rows: 60000 });
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/50000|max_rows/);
  });

  it("indec_aggregate suma y ordena por valor descendente", async () => {
    const { call, calls } = await connect({
      comercio_exterior_exportacion_bienes: () => ({
        body: [
          { Anio: 2025, valor_FOB: 10, valor_FOB_null: null },
          { Anio: 2025, valor_FOB: 5, valor_FOB_null: null },
          { Anio: 2024, valor_FOB: 7, valor_FOB_null: null },
          { Anio: 2024, valor_FOB: null, valor_FOB_null: "s" },
        ],
        headers: { "Content-Range": "0-3/4" },
      }),
    });
    const r = await call("indec_aggregate", { dataset: "comercio_exterior_exportacion_bienes", group_by: ["Anio"], value_column: "valor_FOB" });
    expect(r.json.grupos).toEqual([
      { grupo: { Anio: 2025 }, n: 2, n_numericas: 2, valor: 15 },
      { grupo: { Anio: 2024 }, n: 2, n_numericas: 1, valor: 7 },
    ]);
    expect(r.json.filas_sin_valor).toBe(1);
    expect(r.json.signos_convencionales).toEqual({ s: expect.stringContaining("secreto estadístico") });
    expect(calls.at(-1)!.url.searchParams.get("select")).toBe("Anio,valor_FOB,valor_FOB_null");
  });

  it("indec_comercio_exterior resuelve el país por nombre y agrupa con etiquetas", async () => {
    const nomen = [
      { nombre_columna: "pais_cod", codigo: "BR", codigo_descripcion: "Brasil" },
      { nombre_columna: "pais_cod", codigo: "CL", codigo_descripcion: "Chile" },
      { nombre_columna: "rubro_cod", codigo: "1", codigo_descripcion: "Productos primarios" },
      { nombre_columna: "rubro_cod", codigo: "2", codigo_descripcion: "Manufacturas" },
    ];
    const { call, calls } = await connect({
      comercio_exterior_nomenclaturas: () => ({ body: nomen, headers: { "Content-Range": "0-3/4" } }),
      comercio_exterior_exportacion_bienes: () => ({
        body: [
          { rubro_cod: "1", valor_FOB: 100, Peso_Neto: 10 },
          { rubro_cod: "2", valor_FOB: 300, Peso_Neto: 20 },
          { rubro_cod: "1", valor_FOB: 50, Peso_Neto: 5 },
        ],
        headers: { "Content-Range": "0-2/3" },
      }),
    });
    const r = await call("indec_comercio_exterior", { flujo: "exportaciones", pais: "brasil", desde: "2025", hasta: "2025", agrupar_por: "rubro" });
    expect(r.isError).toBe(false);
    expect(r.json.grupos[0]).toMatchObject({ rubro: "2", descripcion: "Manufacturas", valor_fob_usd: 300, peso_neto_kg: 20 });
    expect(r.json.grupos[1]).toMatchObject({ rubro: "1", descripcion: "Productos primarios", valor_fob_usd: 150 });
    expect(r.json.filtros_resueltos.pais).toEqual(["BR=Brasil"]);
    const dataCall = calls.at(-1)!.url.searchParams;
    expect(dataCall.get("pais_cod")).toBe("in.(BR)");
    expect(dataCall.getAll("Periodo")).toEqual(["gte.202501", "lte.202512"]);
  });

  it("indec_comercio_exterior prefiere la coincidencia exacta del nombre y ordena por fecha al agrupar por año", async () => {
    const nomen = [
      { nombre_columna: "pais_cod", codigo: "CN", codigo_descripcion: "China" },
      { nombre_columna: "pais_cod", codigo: "HK", codigo_descripcion: "Hong Kong Región Administrativa Especial de (China)" },
    ];
    const { call, calls } = await connect({
      comercio_exterior_nomenclaturas: () => ({ body: nomen, headers: { "Content-Range": "0-1/2" } }),
      comercio_exterior_importacion_bienes: () => ({
        body: [
          { Anio: 2025, valor_CIF: 5, valor_CIF_null: null, peso_neto: 1 },
          { Anio: 2024, valor_CIF: 9, valor_CIF_null: null, peso_neto: 2 },
        ],
        headers: { "Content-Range": "0-1/2" },
      }),
    });
    const r = await call("indec_comercio_exterior", { flujo: "importaciones", pais: "china", desde: "2024", hasta: "2025", agrupar_por: "anio" });
    expect(r.json.filtros_resueltos.pais).toEqual(["CN=China"]);
    expect(calls.at(-1)!.url.searchParams.get("pais_cod")).toBe("in.(CN)");
    expect(r.json.grupos.map((g: { anio: string }) => g.anio)).toEqual(["2024", "2025"]);
  });

  it("indec_comercio_exterior rechaza combinaciones inválidas", async () => {
    const { call } = await connect({});
    const r = await call("indec_comercio_exterior", { flujo: "importaciones", rubro: "cereales" });
    expect(r.isError).toBe(true);
    expect(r.text).toMatch(/exportaciones/);
  });

  it("indec_poblacion usa el año en curso acotado al rango del dataset", async () => {
    const { call, calls } = await connect({ proyecciones_poblacion_nacional_2022_2040: () => ({ body: [] }) });
    await call("indec_poblacion", { nivel: "nacional", edad: "30" });
    const q = calls[0]!.url.searchParams;
    const y = Math.min(2040, Math.max(2022, new Date().getFullYear()));
    expect(q.get("fecha")).toBe(`eq.${y}`);
    expect(q.get("edad")).toBe("eq.30");
    expect((await call("indec_poblacion", { nivel: "departamento", edad: "30" })).isError).toBe(true);
  });

  it("indec_status compara el hash del spec", async () => {
    const { call } = await connect({ "": () => ({ body: { openapi: "3.1.0" } }) });
    const r = await call("indec_status");
    expect(r.json).toMatchObject({ token_configurado: true, datasets: 19, spec_cambio: true });
  });
});
