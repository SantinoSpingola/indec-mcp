// Sondeo puntual de la API real (requiere INDEC_API_TOKEN). Uso: node scripts/probe.mjs "<ruta?query>" ...
const H = { Authorization: `Bearer ${process.env.INDEC_API_TOKEN}`, Accept: "application/json" };
for (const path of process.argv.slice(2)) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`https://api.indec.gob.ar/v1/${path}`, { headers: { ...H, Prefer: "count=exact" }, signal: AbortSignal.timeout(30000) });
      const t = await r.text();
      console.log(`\n## ${path}\nHTTP ${r.status} range=${r.headers.get("content-range")}\n${t.slice(0, 700)}`);
      break;
    } catch (e) {
      if (i === 2) console.log(`\n## ${path}\nERROR ${e.cause?.code ?? e.message}`);
    }
  }
}
