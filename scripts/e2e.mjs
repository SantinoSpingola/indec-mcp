// Prueba de extremo a extremo con la API REAL, como la usaría un agente: cliente MCP por stdio, escenarios de uso
// realistas, manejo de errores y chequeo de que el token nunca aparece en una respuesta.
// Uso: INDEC_API_TOKEN=... node scripts/e2e.mjs        (requiere `npm run build` antes)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const token = process.env.INDEC_API_TOKEN ?? "";
if (!token) { console.error("Falta INDEC_API_TOKEN."); process.exit(2); }

const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"], env: { ...process.env }, stderr: "pipe" });
const client = new Client({ name: "e2e", version: "0" });
await client.connect(transport);

let ok = 0, bad = 0;
const fallas = [];
const todo = []; // todo lo que devolvió el servidor, para buscar fugas del token

async function call(name, args = {}) {
  const r = await client.callTool({ name, arguments: args });
  const text = r.content?.[0]?.text ?? "";
  todo.push(text);
  let json = null;
  try { json = JSON.parse(text); } catch { /* texto plano */ }
  return { isError: Boolean(r.isError), text, json };
}
function check(nombre, cond, detalle = "") {
  if (cond) { ok++; console.log(`  ✓ ${nombre}`); } else { bad++; fallas.push(nombre); console.log(`  ✗ ${nombre} ${detalle}`); }
}
const datos = (r) => (r.json && Array.isArray(r.json.datos) ? r.json.datos : r.json && Array.isArray(r.json.grupos) ? r.json.grupos : []);

console.log("Series (última observación por defecto)");
for (const [tool, args] of [
  ["indec_ipc", {}], ["indec_canastas", { canasta: "cba_cbt" }], ["indec_canastas", { canasta: "crianza" }], ["indec_salarios", {}],
  ["indec_precios_mayoristas", {}], ["indec_costo_construccion", { fuente: "icc" }], ["indec_emae", { nivel: "general" }],
  ["indec_emae", { nivel: "sectores" }], ["indec_ipi", { rama: "manufacturero" }], ["indec_ipi", { rama: "minero" }],
  ["indec_pobreza", {}], ["indec_mercado_trabajo", {}], ["indec_poblacion", { nivel: "nacional" }],
]) {
  const r = await call(tool, args);
  check(`${tool} ${JSON.stringify(args)} devuelve datos`, !r.isError && datos(r).length > 0, r.text.slice(0, 120));
}

console.log("Rangos y tipos");
let r = await call("indec_ipc", { tipo: "mensual", desde: "2025-01", hasta: "2025-12", region: "Nacional", nivel: "Nivel general" });
check("IPC mensual 2025 (nivel general, nacional) trae 12 períodos", !r.isError && datos(r).length >= 12, `${datos(r).length} filas · ${r.text.slice(0, 100)}`);
r = await call("indec_ipc", { tipo: "interanual", orden: "desc", limit: 3 });
check("IPC interanual desc limit 3", !r.isError && datos(r).length === 3);
r = await call("indec_canastas", { canasta: "cba_cbt", tipo: "interanual", desde: "2026-01", hasta: "2026-09" });
check("Canastas interanual 2026", !r.isError && datos(r).length > 0);
r = await call("indec_ipc", { columnas: ["periodo"], limit: 2 });
check("`columnas` restringe lo devuelto", !r.isError && datos(r).every((f) => Object.keys(f).length <= 2), JSON.stringify(datos(r)[0]));

console.log("Comercio exterior y códigos");
r = await call("indec_buscar_codigo", { texto: "Brasil", tipo: "pais" });
check("buscar_codigo resuelve Brasil", !r.isError && /brasil/i.test(r.text), r.text.slice(0, 120));
r = await call("indec_comercio_exterior", { flujo: "exportaciones", pais: "Brasil", agrupar_por: "anio", desde: "2023", hasta: "2024" });
check("exportaciones a Brasil por año (2 años, con aviso de datos confidenciales)", !r.isError && datos(r).length === 2 && /confidencial|sin valor/i.test(r.text), r.text.slice(0, 160));
r = await call("indec_comercio_exterior", { flujo: "importaciones", agrupar_por: "pais", desde: "2024", hasta: "2024" });
check("importaciones por país 2024 (Brasil primero)", !r.isError && datos(r).length >= 10 && datos(r)[0].pais === "BR", r.text.slice(0, 160));
r = await call("indec_comercio_exterior", { flujo: "importaciones", rubro: "x" });
check("rubro en importaciones → error claro", r.isError && /exportaciones/.test(r.text), r.text.slice(0, 120));

console.log("Herramientas genéricas");
r = await call("indec_describe_dataset", { dataset: "ipc_nacional" });
check("describe_dataset trae columnas", !r.isError && /periodo/.test(r.text));
r = await call("indec_count_rows", { dataset: "pobreza_eph" });
check("count_rows pobreza_eph", !r.isError && Number(r.json?.total ?? r.json?.count) > 0, r.text.slice(0, 100));
r = await call("indec_distinct_values", { dataset: "ipc_nacional", column: "region" });
check("distinct_values region", !r.isError && /Nacional/.test(r.text), r.text.slice(0, 120));
r = await call("indec_aggregate", { dataset: "pobreza_eph", value_column: "tasa_pobreza_personas", agg: "avg", group_by: ["anio"], max_rows: 100 });
check("aggregate avg agrupando", !r.isError, r.text.slice(0, 160));
r = await call("indec_query_dataset", { dataset: "valorizacion_canastas_cba_cbt", filters: [{ column: "periodo", op: "eq", value: "202609" }], limit: 5 });
check("query_dataset con filtro de período", !r.isError && datos(r).length > 0, r.text.slice(0, 160));

console.log("Errores que un agente puede cometer (deben ser claros, no romper)");
r = await call("indec_query_dataset", { dataset: "no_existe" });
check("dataset inexistente → error claro", r.isError && r.text.length > 10, r.text.slice(0, 120));
r = await call("indec_query_dataset", { dataset: "ipc_nacional", filters: [{ column: "columna_falsa", op: "eq", value: "x" }] });
check("columna inexistente → error claro", r.isError && /columna|column/i.test(r.text), r.text.slice(0, 140));
r = await call("indec_ipc", { desde: "ayer" });
check("período mal formado → error claro", r.isError, r.text.slice(0, 140));
r = await call("indec_query_dataset", { dataset: "ipc_nacional", limit: 999999 });
check("limit excesivo → error o recorte, sin romper", r.isError || (r.json && datos(r).length <= 5000), `${datos(r).length} filas`);
r = await call("indec_status");
check("status informa token configurado", r.json?.token_configurado === true);

console.log("Recursos y prompts");
const res = await client.readResource({ uri: "indec://catalogo" });
check("resource catálogo", (res.contents?.[0]?.text ?? "").includes("ipc_nacional"));
const res2 = await client.readResource({ uri: "indec://dataset/ipc_nacional" });
check("resource dataset/{id}", (res2.contents?.[0]?.text ?? "").length > 100);
const pr = await client.getPrompt({ name: "informe-inflacion", arguments: { region: "Nacional" } });
check("prompt informe-inflacion", (pr.messages?.[0]?.content?.text ?? "").length > 50);
const pr2 = await client.getPrompt({ name: "comercio-exterior-por-pais", arguments: { pais: "Brasil", anio: "2024" } });
check("prompt comercio-exterior-por-pais", (pr2.messages?.[0]?.content?.text ?? "").includes("Brasil"));

console.log("Seguridad");
const fuga = todo.some((t) => t.includes(token) || t.includes(token.slice(0, 40)));
check("el token no aparece en ninguna respuesta", !fuga);

await client.close();
console.log(`\n${ok} ok, ${bad} con problemas`);
if (bad) { console.log("Fallaron:\n - " + fallas.join("\n - ")); process.exit(1); }
