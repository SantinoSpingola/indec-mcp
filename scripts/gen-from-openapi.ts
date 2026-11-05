/**
 * Genera src/datasets/registry.generated.ts a partir de docs/openapi.snapshot.json.
 * Uso: npm run gen            (usa el snapshot local)
 *      npm run gen -- --fetch (descarga el spec público de https://api.indec.gob.ar/v1/ y actualiza el snapshot)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const snapshotPath = join(root, "docs", "openapi.snapshot.json");
const outPath = join(root, "src", "datasets", "registry.generated.ts");

if (process.argv.includes("--fetch")) {
  const res = await fetch("https://api.indec.gob.ar/v1/", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`No se pudo bajar el spec: HTTP ${res.status}`);
  writeFileSync(snapshotPath, Buffer.from(await res.arrayBuffer()));
  console.log("Snapshot actualizado.");
}

const raw = readFileSync(snapshotPath);
const sha256 = createHash("sha256").update(raw).digest("hex");
const spec = JSON.parse(raw.toString("utf8"));

type Prop = { description?: string; type?: string; anyOf?: { type?: string }[] };

function colType(p: Prop): { type: "string" | "number" | "mixed"; nullable: boolean } {
  const kinds = new Set<string>();
  let nullable = false;
  if (p.type) kinds.add(p.type);
  for (const a of p.anyOf ?? []) {
    if (a.type === "null") nullable = true;
    else if (a.type) kinds.add(a.type);
  }
  if (kinds.size === 1) {
    const k = [...kinds][0];
    if (k === "string" || k === "number") return { type: k, nullable };
  }
  // Sin tipo fijo (p. ej. valores que pueden ser número o signo convencional) -> mixto.
  return { type: "mixed", nullable: nullable || kinds.size === 0 };
}

const clean = (s: string) => s.replace(/\r/g, "").trim();

const datasets = [];
for (const [path, item] of Object.entries<any>(spec.paths)) {
  const op = item.get;
  if (!op) continue;
  const id = path.replace(/^\//, "");
  const schema = spec.components.schemas[id];
  if (!schema) throw new Error(`Sin schema para ${id}`);

  const fullDesc: string = op.description ?? "";
  const descripcion = clean(fullDesc.split("### Ejemplos de uso")[0] ?? fullDesc);
  const pkSection = fullDesc.split("### Clave primaria")[1] ?? "";
  let claveOrden = [...pkSection.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
  if (claveOrden.length === 0) {
    const orderParam = (op.parameters ?? []).find((p: any) => p.name === "order");
    const m = (orderParam?.description ?? "").match(/clave completa:\s*([\w,\-]+)/);
    claveOrden = m ? m[1]!.split(",") : [];
  }

  const columnas = Object.entries<Prop>(schema.properties).map(([name, p]) => {
    const t = colType(p);
    return { name, type: t.type, nullable: t.nullable, description: clean(p.description ?? "") };
  });
  const names = new Set(columnas.map((c) => c.name));
  for (const k of claveOrden) if (!names.has(k)) throw new Error(`${id}: clave ${k} no es columna`);

  const columnaPeriodo = ["periodo", "Periodo"].find((n) => names.has(n)) ?? (names.has("fecha") ? "fecha" : null);
  const columnaAnio = ["anio", "Anio"].find((n) => names.has(n)) ?? null;
  const pdesc = columnas.find((c) => c.name === columnaPeriodo)?.description ?? "";
  let frecuencia = "sin_periodo";
  if (columnaPeriodo === "fecha") frecuencia = "anual";
  else if (/AAAAMM/.test(pdesc)) frecuencia = "mensual";
  else if (/AAAANS/.test(pdesc)) frecuencia = "semestral";
  else if (/AAAANT/.test(pdesc)) frecuencia = "trimestral";

  datasets.push({
    id,
    area: op.tags?.[0] ?? "",
    titulo: op.summary ?? id,
    descripcion,
    columnas,
    claveOrden,
    columnaPeriodo,
    columnaAnio,
    frecuencia,
  });
}

const body = `// ARCHIVO GENERADO por scripts/gen-from-openapi.ts — no editar a mano.
import type { DatasetDef } from "./types.js";

export const SPEC_META = ${JSON.stringify(
  { titulo: spec.info.title, version: spec.info.version, openapi: spec.openapi, sha256 },
  null,
  2,
)} as const;

export const DATASETS: readonly DatasetDef[] = ${JSON.stringify(datasets, null, 2)};
`;
writeFileSync(outPath, body);
console.log(`Generados ${datasets.length} datasets (spec sha256 ${sha256.slice(0, 12)}…) -> ${outPath}`);
