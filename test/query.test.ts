import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { InputError } from "../src/client/errors.js";
import { buildSearchParams, encodeFilter, getDataset, parseContentRange } from "../src/client/query.js";
import { DATASETS, SPEC_META } from "../src/datasets/registry.generated.js";
import { normalizarPeriodo } from "../src/domain/periodos.js";

describe("registry (contrato con el spec)", () => {
  const spec = JSON.parse(readFileSync("docs/openapi.snapshot.json", "utf8"));

  it("cubre exactamente los endpoints del spec", () => {
    expect(DATASETS.map((d) => `/${d.id}`).sort()).toEqual(Object.keys(spec.paths).sort());
    expect(DATASETS).toHaveLength(19);
  });

  it("el registry está sincronizado con el snapshot (correr `npm run gen` si falla)", () => {
    const sha = createHash("sha256").update(readFileSync("docs/openapi.snapshot.json")).digest("hex");
    expect(SPEC_META.sha256).toBe(sha);
  });

  it("la clave de orden de cada dataset son columnas reales y no está vacía", () => {
    for (const d of DATASETS) {
      expect(d.claveOrden.length, d.id).toBeGreaterThan(0);
      const names = new Set(d.columnas.map((c) => c.name));
      for (const k of d.claveOrden) expect(names.has(k), `${d.id}.${k}`).toBe(true);
    }
  });

  it("detecta frecuencia y columna de período", () => {
    expect(getDataset("ipc_nacional")).toMatchObject({ frecuencia: "mensual", columnaPeriodo: "periodo" });
    expect(getDataset("canasta-crianza")).toMatchObject({ frecuencia: "mensual", columnaPeriodo: "Periodo" });
    expect(getDataset("pobreza_eph").frecuencia).toBe("semestral");
    expect(getDataset("mercado_trabajo_eph").frecuencia).toBe("trimestral");
    expect(getDataset("proyecciones_poblacion_nacional_2022_2040")).toMatchObject({ frecuencia: "anual", columnaPeriodo: "fecha" });
    expect(getDataset("comercio_exterior_nomenclaturas").columnaPeriodo).toBeNull();
  });
});

describe("buildSearchParams", () => {
  it("agrega la clave primaria completa al order para paginar de forma estable", () => {
    const sp = buildSearchParams({ dataset: "pobreza_eph", order: [{ column: "periodo", dir: "desc" }] });
    expect(sp.get("order")).toBe("periodo.desc,area_geografica_nom.asc");
  });

  it("sin order usa la clave completa", () => {
    expect(buildSearchParams({ dataset: "comercio_exterior_nomenclaturas" }).get("order")).toBe("nombre_columna.asc,codigo.asc");
  });

  it("limita a 1000 y valida enteros", () => {
    expect(buildSearchParams({ dataset: "pobreza_eph", limit: 5000 }).get("limit")).toBe("1000");
    expect(() => buildSearchParams({ dataset: "pobreza_eph", limit: 0 })).toThrow(InputError);
    expect(() => buildSearchParams({ dataset: "pobreza_eph", offset: -1 })).toThrow(InputError);
  });

  it("rechaza columnas inexistentes y sugiere la capitalización correcta", () => {
    expect(() => buildSearchParams({ dataset: "comercio_exterior_exportacion_bienes", filters: [{ column: "anio", op: "eq", value: 2024 }] })).toThrow(/Anio/);
    expect(() => buildSearchParams({ dataset: "pobreza_eph", select: ["nope"] })).toThrow(InputError);
  });

  it("acepta las columnas hermanas <col>_null que expone la API (signos convencionales)", () => {
    const sp = buildSearchParams({
      dataset: "comercio_exterior_exportacion_bienes",
      select: ["Anio", "valor_FOB", "valor_FOB_null"],
      filters: [{ column: "valor_FOB_null", op: "eq", value: "s" }],
    });
    expect(sp.get("select")).toBe("Anio,valor_FOB,valor_FOB_null");
    expect(sp.get("valor_FOB_null")).toBe("eq.s");
    expect(() => buildSearchParams({ dataset: "pobreza_eph", select: ["inventada_null"] })).toThrow(InputError);
  });

  it("rechaza datasets desconocidos", () => {
    expect(() => buildSearchParams({ dataset: "../etc/passwd" })).toThrow(/desconocido/);
  });

  it("codifica filtros multiples sobre la misma columna", () => {
    const sp = buildSearchParams({
      dataset: "ipc_nacional",
      filters: [
        { column: "periodo", op: "gte", value: "202401" },
        { column: "periodo", op: "lte", value: "202412" },
      ],
    });
    expect(sp.getAll("periodo")).toEqual(["gte.202401", "lte.202412"]);
  });
});

describe("encodeFilter", () => {
  it("in entrecomilla valores con caracteres especiales", () => {
    expect(encodeFilter({ column: "x", op: "in", value: ["a", "b,c", 'd"e', 3] })).toBe('in.(a,"b,c","d\\"e",3)');
  });
  it("in exige lista no vacía", () => {
    expect(() => encodeFilter({ column: "x", op: "in", value: [] })).toThrow(InputError);
  });
  it("is solo admite null/true/false", () => {
    expect(encodeFilter({ column: "x", op: "is", value: null })).toBe("is.null");
    expect(() => encodeFilter({ column: "x", op: "is", value: "algo" })).toThrow(InputError);
  });
  it("like/ilike convierten % en *", () => {
    expect(encodeFilter({ column: "x", op: "ilike", value: "%pan%" })).toBe("ilike.*pan*");
  });
  it("no permite listas en operadores escalares", () => {
    expect(() => encodeFilter({ column: "x", op: "eq", value: [1, 2] })).toThrow(InputError);
  });
  it("no deja pasar inyección de parámetros: el valor viaja codificado", () => {
    const sp = buildSearchParams({ dataset: "pobreza_eph", filters: [{ column: "area_geografica_nom", op: "eq", value: "x&limit=99999" }] });
    expect(sp.toString()).toContain("eq.x%26limit%3D99999");
    expect(sp.get("limit")).toBe("100");
  });
});

describe("parseContentRange", () => {
  it("interpreta los formatos de PostgREST", () => {
    expect(parseContentRange("0-999/103545")).toEqual({ start: 0, end: 999, total: 103545 });
    expect(parseContentRange("*/0")).toEqual({ start: 0, end: -1, total: 0 });
    expect(parseContentRange("0-9/*")).toEqual({ start: 0, end: 9, total: null });
    expect(parseContentRange(null)).toBeNull();
    expect(parseContentRange("basura")).toBeNull();
  });
});

describe("normalizarPeriodo", () => {
  it("mensual", () => {
    expect(normalizarPeriodo("mensual", "2025", "desde")).toBe("202501");
    expect(normalizarPeriodo("mensual", "2025", "hasta")).toBe("202512");
    expect(normalizarPeriodo("mensual", "2025-3", "desde")).toBe("202503");
    expect(normalizarPeriodo("mensual", "2025/03", "hasta")).toBe("202503");
    expect(normalizarPeriodo("mensual", "202511", "desde")).toBe("202511");
    expect(() => normalizarPeriodo("mensual", "2025-13", "desde")).toThrow(InputError);
  });
  it("semestral y trimestral", () => {
    // Formato real de la API: "20261S" (semestre) y "20262T" (trimestre).
    expect(normalizarPeriodo("semestral", "2024", "desde")).toBe("20241S");
    expect(normalizarPeriodo("semestral", "2024", "hasta")).toBe("20242S");
    expect(normalizarPeriodo("semestral", "2024-2", "desde")).toBe("20242S");
    expect(normalizarPeriodo("semestral", "20251S", "desde")).toBe("20251S");
    expect(normalizarPeriodo("trimestral", "2024T3", "hasta")).toBe("20243T");
    expect(normalizarPeriodo("trimestral", "20262T", "desde")).toBe("20262T");
    expect(normalizarPeriodo("trimestral", "2024", "hasta")).toBe("20244T");
    expect(() => normalizarPeriodo("semestral", "2024-3", "desde")).toThrow(InputError);
  });
  it("anual y errores", () => {
    expect(normalizarPeriodo("anual", "2030", "desde")).toBe("2030");
    expect(() => normalizarPeriodo("mensual", "marzo", "desde")).toThrow(InputError);
    expect(() => normalizarPeriodo("sin_periodo", "2024", "desde")).toThrow(InputError);
  });
});
