import { InputError } from "../client/errors.js";
import type { Frecuencia } from "../datasets/types.js";

/**
 * Normaliza un período escrito por una persona/agente al formato REAL de la API (verificado contra datos):
 *  - mensual    AAAAMM: "2025", "2025-03", "2025/3", "202503"  → "202503"
 *  - semestral  AAAANS: "2025", "2025-2", "2025S2", "20252S"    → "20252S"
 *  - trimestral AAAANT: "2025", "2025T3", "2025-3", "20253T"    → "20253T"
 *  - anual      AAAA:   "2025"
 * Para un año solo, `borde` decide si se toma el primer ("desde") o el último ("hasta") subperíodo.
 */
export function normalizarPeriodo(frecuencia: Frecuencia, entrada: string, borde: "desde" | "hasta"): string {
  const txt = entrada.trim().toUpperCase().replace(/[ST\-/ ]/g, "");
  if (!/^\d{4,6}$/.test(txt)) throw new InputError(`Período inválido "${entrada}". Usá AAAA, AAAAMM, AAAA-MM, AAAA-N, etc.`);

  const anio = txt.slice(0, 4);
  const resto = txt.slice(4);

  switch (frecuencia) {
    case "anual":
      return anio;
    case "mensual": {
      if (!resto) return borde === "desde" ? `${anio}01` : `${anio}12`;
      const mes = Number(resto);
      if (mes < 1 || mes > 12) throw new InputError(`Mes inválido en "${entrada}".`);
      return `${anio}${String(mes).padStart(2, "0")}`;
    }
    case "semestral":
    case "trimestral": {
      const sem = frecuencia === "semestral";
      const max = sem ? 2 : 4;
      const sufijo = sem ? "S" : "T";
      if (!resto) return `${anio}${borde === "desde" ? 1 : max}${sufijo}`;
      const n = Number(resto);
      if (n < 1 || n > max) throw new InputError(`${sem ? "Semestre" : "Trimestre"} inválido en "${entrada}" (1–${max}).`);
      return `${anio}${n}${sufijo}`;
    }
    case "sin_periodo":
      throw new InputError("Este dataset no tiene columna de período.");
  }
}
