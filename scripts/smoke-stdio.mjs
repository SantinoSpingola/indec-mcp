// Smoke test: lanza dist/index.js por stdio como lo haría un cliente MCP real.
// Uso: node scripts/smoke-stdio.mjs            (sin token: valida handshake y tools offline)
//      INDEC_API_TOKEN=... node scripts/smoke-stdio.mjs --live   (además hace 1 request real por dataset)
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const live = process.argv.includes("--live");
const transport = new StdioClientTransport({ command: process.execPath, args: ["dist/index.js"], env: { ...process.env }, stderr: "pipe" });
const client = new Client({ name: "smoke", version: "0" });
await client.connect(transport);

const tools = (await client.listTools()).tools;
console.log(`tools: ${tools.length} → ${tools.map((t) => t.name).join(", ")}`);

const call = async (name, args = {}) => {
  const r = await client.callTool({ name, arguments: args });
  return { isError: Boolean(r.isError), text: r.content[0].text };
};

const list = await call("indec_list_datasets");
console.log("datasets:", JSON.parse(list.text).total);

const ipc = await call("indec_ipc");
console.log("indec_ipc ->", ipc.isError ? `error (esperado sin token): ${ipc.text.slice(0, 90)}…` : ipc.text.slice(0, 200));

const status = await call("indec_status");
console.log("indec_status ->", status.text);

if (live) {
  const ids = JSON.parse(list.text).datasets.map((d) => d.id);
  let bad = 0;
  for (const dataset of ids) {
    const r = await call("indec_query_dataset", { dataset, limit: 1 });
    const j = r.isError ? null : JSON.parse(r.text);
    console.log(`${r.isError ? "✗" : "✓"} ${dataset}`, r.isError ? r.text.slice(0, 120) : `filas=${j.filas} total=${j.total}`);
    if (r.isError) bad++;
  }
  process.exitCode = bad ? 1 : 0;
}

await client.close();
