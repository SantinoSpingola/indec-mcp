import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IndecClient } from "./client/client.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { registerCuratedTools } from "./tools/curated.js";
import { registerGenericTools } from "./tools/generic.js";

import { SERVER_NAME, SERVER_VERSION } from "./version.js";
export { SERVER_NAME, SERVER_VERSION };

export function createServer(client: IndecClient = new IndecClient()): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions:
        "Acceso de solo lectura a las estadísticas oficiales del INDEC (Argentina) vía su API (api.indec.gob.ar, en BETA). Servicio NO oficial. " +
        "Flujo recomendado: indec_list_datasets → indec_describe_dataset → tool curada (indec_ipc, indec_emae, …) o indec_query_dataset. " +
        "Sin rango de fechas, las tools de series devuelven solo el último período. Los valores pueden traer signos convencionales (*, **, s, …): mencionalos al informar. " +
        "Citá siempre INDEC como fuente y no inventes cifras.",
    },
  );
  registerGenericTools(server, client);
  registerCuratedTools(server, client);
  registerResources(server);
  registerPrompts(server);
  return server;
}
