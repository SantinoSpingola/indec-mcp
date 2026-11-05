export type ColumnType = "string" | "number" | "mixed";

export interface ColumnDef {
  name: string;
  type: ColumnType;
  nullable: boolean;
  description: string;
}

export type Frecuencia = "mensual" | "trimestral" | "semestral" | "anual" | "sin_periodo";

export interface DatasetDef {
  /** Ruta exacta del endpoint (sin "/"). Es el id del dataset. */
  id: string;
  /** Área del INDEC que lo produce (tag del spec). */
  area: string;
  titulo: string;
  /** Descripción sin los ejemplos de uso autogenerados. */
  descripcion: string;
  columnas: ColumnDef[];
  /** Clave primaria completa, en el orden que exige el spec para paginar de forma estable. */
  claveOrden: string[];
  /** Nombre exacto de la columna de período ("periodo", "Periodo", "fecha") o null. */
  columnaPeriodo: string | null;
  /** Nombre exacto de la columna de año si existe ("anio", "Anio") o null. */
  columnaAnio: string | null;
  frecuencia: Frecuencia;
}
