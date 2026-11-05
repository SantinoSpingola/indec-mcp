#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IndecClient } from "./client/client.js";
import { createServer } from "./server.js";

async function main() {
  const client = new IndecClient();
  const server = createServer(client);
  await server.connect(new StdioServerTransport());
  // stdout es el canal MCP: los logs van a stderr y nunca incluyen el token.
  console.error(`indec-mcp listo (stdio). Token ${client.hasToken ? "configurado" : "NO configurado: definí INDEC_API_TOKEN"}.`);
}

main().catch((e) => {
  console.error("Error fatal:", e instanceof Error ? e.message : e);
  process.exit(1);
});
