/** Signos convencionales oficiales del INDEC (documentados en el spec de la API). */
export const SIGNOS_CONVENCIONALES: Readonly<Record<string, string>> = {
  "*": "Dato provisorio",
  "**": "Dato preliminar",
  e: "Dato estimado por extrapolación, proyección",
  i: "Dato estimado por imputación",
  u: "Dato de calidad inferior al estándar",
  "-": "Cero absoluto",
  ".": "Dato no registrado",
  "...": "Dato no disponible a la fecha de presentación de los resultados",
  "///": "Dato que no corresponde presentar",
  s: "Dato confidencial por aplicación de las reglas del secreto estadístico",
};

export const NOTA_REDONDEO =
  "Los totales por suma pueden no coincidir por redondeo y las variaciones calculadas pueden diferir de las publicadas en los informes técnicos.";

export const FUENTE = "Fuente: INDEC — Catálogo API-INDEC (api.indec.gob.ar). Servicio no oficial de acceso.";
