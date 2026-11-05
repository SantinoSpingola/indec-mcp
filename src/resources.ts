import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDataset, listDatasets } from "./client/query.js";
import { NOTA_REDONDEO, SIGNOS_CONVENCIONALES } from "./domain/signos.js";

const json = (uri: string, data: unknown) => ({ contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] });

export function registerResources(server: McpServer): void {
  server.registerResource(
    "catalogo",
    "indec://catalogo",
    { title: "Catálogo de datasets del INDEC", description: "Los 19 datasets disponibles con área, frecuencia y clave de orden.", mimeType: "application/json" },
    async (uri) => json(uri.href, listDatasets().map((d) => ({ id: d.id, titulo: d.titulo, area: d.area, frecuencia: d.frecuencia, clave_orden: d.claveOrden }))),
  );

  server.registerResource(
    "signos-convencionales",
    "indec://signos-convencionales",
    { title: "Signos convencionales del INDEC", description: "Significado de *, **, e, i, u, -, ., ..., ///, s en valores y observaciones.", mimeType: "application/json" },
    async (uri) => json(uri.href, { signos: SIGNOS_CONVENCIONALES, nota: NOTA_REDONDEO }),
  );

  server.registerResource(
    "guia-paginacion",
    "indec://guia-paginacion",
    { title: "Guía de paginación de la API", description: "Reglas de paginación y conteo de la API del INDEC.", mimeType: "text/markdown" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text:
            "# Paginación\n\n- Máximo 1000 filas por respuesta, aunque `limit` sea mayor.\n- Ordenar siempre por la clave primaria completa (indec_describe_dataset → clave_orden); este servidor la agrega solo.\n" +
            "- `siguiente_offset` de cada respuesta indica el `offset` de la próxima página (null = no hay más).\n- El total exacto se pide con `count=true` (header `Prefer: count=exact`).\n",
        },
      ],
    }),
  );

  server.registerResource(
    "dataset",
    new ResourceTemplate("indec://dataset/{id}", {
      list: async () => ({ resources: listDatasets().map((d) => ({ uri: `indec://dataset/${d.id}`, name: d.id, title: d.titulo, mimeType: "application/json" })) }),
    }),
    { title: "Esquema de un dataset", description: "Columnas, tipos y clave de orden de un dataset.", mimeType: "application/json" },
    async (uri, vars) => json(uri.href, getDataset(String(vars.id))),
  );
}
