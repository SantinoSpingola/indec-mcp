// Verificación manual contra la API real (requiere INDEC_API_TOKEN). Imprime muestras compactas.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({ name: "verify", version: "0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"], env: { ...process.env }, stderr: "pipe" }));

const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content[0].text;
  return r.isError ? { error: text } : JSON.parse(text);
};
const show = (title, v, max = 900) => {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  console.log(`\n## ${title}\n${s.length > max ? s.slice(0, max) + "…" : s}`);
};

const only = process.argv[2];
const steps = {
  async distinct() {
    for (const [dataset, column] of [
      ["ipc_nacional", "region"],
      ["ipc_nacional", "tipo_de_indicador"],
      ["ipc_nacional", "tipo_de_indicador_descripcion"],
      ["ipc_nacional", "nivel"],
      ["ipc_nacional", "clasificador"],
      ["valorizacion_canastas_cba_cbt", "descripcion"],
      ["valorizacion_canastas_cba_cbt", "tipo_de_indicador_descripcion"],
      ["indice_salarios", "descripcion"],
      ["indice_salarios", "tipo_de_indicador_descripcion"],
      ["pobreza_eph", "area_geografica_nom"],
      ["mercado_trabajo_eph", "area_geografica_nom"],
      ["comercio_exterior_nomenclaturas", "nombre_columna"],
      ["estimador-mensual-de-actividad-economica-nivel-general", "tipo_de_indicador_descripcion"],
      ["ipi_manufacturero", "serie"],
      ["proyecciones_poblacion_nacional_2022_2040", "sexo_nom"],
    ]) {
      const r = await call("indec_distinct_values", { dataset, column, max_rows: 3000 });
      show(`${dataset}.${column}`, r.error ?? { periodo: r.periodo_explorado, n: r.cantidad, valores: r.valores.slice(0, 25) }, 1200);
    }
  },
  async samples() {
    show("ipc nacional mensual (último)", await call("indec_ipc", { region: "Nacional", nivel: "Nivel General", tipo: "mensual" }), 1400);
    show("ipc interanual nacional 2026 (rango)", await call("indec_ipc", { region: "Nacional", nivel: "Nivel General", tipo: "interanual", desde: "2026-01", hasta: "2026-03", limit: 5 }), 1800);
    show("ipc divisiones mensual último", await call("indec_ipc", { region: "Nacional", nivel: "División", tipo: "mensual", limit: 20, columnas: ["descripcion", "periodo", "valor"] }), 1800);
    show("salarios privado registrado interanual", await call("indec_salarios", { descripcion: "privado registrado", tipo: "interanual" }), 900);
    show("mayoristas IPIM mensual", await call("indec_precios_mayoristas", { indicador: "IPIM", tipo: "mensual", descripcion: "nivel general", limit: 3 }), 900);
    show("icc mensual", await call("indec_costo_construccion", { tipo: "mensual", limit: 3 }), 900);
    show("ipi manufacturero interanual", await call("indec_ipi", { serie: "original", tipo: "interanual", actividad: "nivel general", limit: 3 }), 900);
    show("emae sectores interanual", await call("indec_emae", { nivel: "sectores", tipo: "interanual", limit: 3 }), 900);
    show("emae general desest. variación", await call("indec_emae", { serie: "desestacionalizada", medida: "variacion" }), 900);
    show("pobreza serie 2025-2026", await call("indec_pobreza", { desde: "2025", hasta: "2026", columnas: ["periodo", "tasa_pobreza_personas", "tasa_indigencia_personas", "observaciones"] }), 900);
    show("poblacion jurisdicción Córdoba", await call("indec_poblacion", { nivel: "jurisdiccion", jurisdiccion: "Córdoba", limit: 3 }), 900);
    show("poblacion departamento", await call("indec_poblacion", { nivel: "departamento", departamento: "Rosario", limit: 3 }), 900);
    show("pobreza último", await call("indec_pobreza", { limit: 3 }), 1500);
    show("mercado trabajo último", await call("indec_mercado_trabajo", { limit: 3 }), 1500);
    show("canastas", await call("indec_canastas", { limit: 4 }), 1500);
    show("crianza", await call("indec_canastas", { canasta: "crianza", limit: 1 }), 1200);
    show("emae general", await call("indec_emae", { limit: 4 }), 1500);
    show("poblacion nacional 30 años", await call("indec_poblacion", { edad: "30", limit: 3 }), 1200);
  },
  async comercio() {
    show("buscar Brasil", await call("indec_buscar_codigo", { texto: "brasil" }), 800);
    show("export a Brasil por rubro (último año completo)", await call("indec_comercio_exterior", { flujo: "exportaciones", pais: "brasil", desde: "2025-01", hasta: "2025-12", agrupar_por: "rubro", limit: 6 }), 1800);
    show("export subrubro cereales a todos, 2025", await call("indec_comercio_exterior", { flujo: "exportaciones", subrubro: "cereales", desde: "2025-01", hasta: "2025-12", agrupar_por: "pais", limit: 4 }), 1500);
    show("export totales por año 2023-2025", await call("indec_comercio_exterior", { flujo: "exportaciones", desde: "2023", hasta: "2025", agrupar_por: "anio", limit: 5 }), 1500);
    show("import bienes de capital desde China", await call("indec_comercio_exterior", { flujo: "importaciones", pais: "china", uso_economico: "bienes de capital", desde: "2025", hasta: "2025", agrupar_por: "periodo", limit: 3 }), 1500);
    show("import por uso económico", await call("indec_comercio_exterior", { flujo: "importaciones", desde: "2025-01", hasta: "2025-12", agrupar_por: "uso_economico", limit: 6 }), 1800);
  },
  async tipos() {
    for (const [dataset, column] of [
      ["indice_salarios", "tipo_de_indicador"],
      ["indice_salarios", "indicador"],
      ["sipm_precios_mayoristas", "tipo_de_indicador"],
      ["sipm_precios_mayoristas", "indicador"],
      ["sipm_precios_mayoristas", "operativo"],
      ["icc_precios_construccion", "tipo_de_indicador"],
      ["icc_precios_construccion", "indicador"],
      ["redeterminacion_precios_contratos_obras_publicas", "tipo_de_indicador"],
      ["ipi_manufacturero", "tipo_de_indicador"],
      ["ipi_minero", "tipo_de_indicador"],
      ["estimador-mensual-de-actividad-economica-sectores", "tipo_de_indicador"],
      ["valorizacion_canastas_cba_cbt", "tipo_de_indicador"],
      ["ipc_nacional", "indicador"],
    ]) {
      const r = await call("indec_distinct_values", { dataset, column, max_rows: 3000 });
      show(`${dataset}.${column}`, r.error ?? { periodo: r.periodo_explorado, valores: r.valores.slice(0, 15) }, 700);
    }
    // ¿La API acepta filtrar/seleccionar columnas *_null?
    const a = await call("indec_query_dataset", { dataset: "comercio_exterior_exportacion_bienes", select: ["Anio", "valor_FOB", "valor_FOB_null"], filters: [{ column: "valor_FOB_null", op: "eq", value: "s" }], limit: 1 });
    show("filtro por valor_FOB_null (esperado: error de columna en mi validación)", a, 400);
    const r = await fetch(`https://api.indec.gob.ar/v1/comercio_exterior_exportacion_bienes?select=Anio,valor_FOB,valor_FOB_null&valor_FOB_null=eq.s&limit=1`, { headers: { Authorization: `Bearer ${process.env.INDEC_API_TOKEN}` } });
    show("API directa con valor_FOB_null=eq.s", `HTTP ${r.status} ${(await r.text()).slice(0, 300)}`);
    const r2 = await fetch(`https://api.indec.gob.ar/v1/ipc_nacional?limit=1&periodo=gte.202609&periodo=lte.202609&tipo_de_indicador=eq.v_m&descripcion=eq.Nivel%20general&region=eq.Nacional`, { headers: { Authorization: `Bearer ${process.env.INDEC_API_TOKEN}` } });
    show("IPC nivel general nacional v_m", `HTTP ${r2.status} ${(await r2.text()).slice(0, 700)}`);
  },
  async signos() {
    // Busca valores no numéricos en columnas de valor de varios datasets.
    for (const [dataset, col, filt] of [
      ["ipc_nacional", "valor", [{ column: "valor", op: "is", value: null }]],
      ["ipc_nacional", "observaciones", [{ column: "observaciones", op: "is", value: false }]],
      ["comercio_exterior_exportacion_bienes", "valor_FOB", [{ column: "valor_FOB", op: "is", value: null }]],
    ]) {
      const r = await call("indec_query_dataset", { dataset, filters: filt, limit: 3 });
      show(`nulos/obs en ${dataset}.${col}`, r.error ?? { total: r.total, muestra: r.datos.slice(0, 2), signos: r.signos_convencionales }, 1200);
    }
  },
};
for (const [name, fn] of Object.entries(steps)) if (!only || only === name) await fn();
await client.close();
