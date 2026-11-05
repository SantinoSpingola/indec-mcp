# indec-mcp

Servidor [MCP](https://modelcontextprotocol.io) (Model Context Protocol) para consultar las estadísticas del **INDEC** de Argentina desde agentes de IA (Claude, Cursor y cualquier cliente MCP), sobre la API oficial [`api.indec.gob.ar`](https://api.indec.gob.ar) (hoy en BETA).

> **Proyecto no oficial.** No está afiliado ni respaldado por el INDEC. Los datos pertenecen al INDEC: citá siempre la fuente.

```text
Vos:    ¿Cuánto fue la inflación de cada mes de 2025 y cómo se compara con la canasta básica?
Claude: [indec_ipc → indec_canastas] …
```

Cubre los **19 datasets** de la API: IPC, canastas (CBA/CBT y de crianza), salarios, precios mayoristas, costo de la construcción, EMAE, IPI manufacturero y minero, pobreza, mercado de trabajo (EPH), población (nacional, por jurisdicción y por departamento) y comercio exterior (exportaciones, importaciones y nomenclaturas).

*English:* an MCP server that lets AI agents query Argentina's national statistics office (INDEC) through its public API: inflation, wage indices, poverty, GDP proxy (EMAE), trade and more. Unofficial. Requires a free INDEC API token (see below). Spanish-language tool descriptions and responses.

## Requisitos

- Node.js ≥ 20
- Un **token JWT** de la API del INDEC (gratis): registrate en <https://api.indec.gob.ar>, verificá el mail con el código OTP y generalo desde tu perfil. Se muestra una sola vez y vence a los 12 meses.

## Instalación

No hace falta clonar nada: los clientes MCP lo ejecutan con `npx` directamente desde GitHub (la primera vez compila, tarda un minuto).

### Claude Desktop / Cursor

Agregá esto a la configuración de servidores MCP (en Claude Desktop: *Settings → Developer → Edit Config*):

```json
{
  "mcpServers": {
    "indec": {
      "command": "npx",
      "args": ["-y", "github:SantinoSpingola/indec-mcp"],
      "env": { "INDEC_API_TOKEN": "tu_token_jwt" }
    }
  }
}
```

### Claude Code

```bash
claude mcp add indec --env INDEC_API_TOKEN=tu_token_jwt -- npx -y github:SantinoSpingola/indec-mcp
```

### Desde el código fuente

```bash
git clone https://github.com/SantinoSpingola/indec-mcp.git
cd indec-mcp
npm install        # compila solo (script `prepare`)
```

y apuntá tu cliente a `node /ruta/a/indec-mcp/dist/index.js`.

> **Tu token es personal.** Ponelo solo en la variable de entorno de tu cliente MCP; el servidor nunca lo escribe en logs ni en las respuestas.

### Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `INDEC_API_TOKEN` | — | JWT del portal (obligatorio para consultar datos) |
| `INDEC_API_BASE_URL` | `https://api.indec.gob.ar/v1/` | Base de la API. Solo se acepta HTTPS (o `localhost`), porque el token viaja en cada consulta |
| `INDEC_CACHE_TTL_SECONDS` | `3600` | TTL de la caché en memoria (0 = sin caché) |
| `INDEC_REQUEST_TIMEOUT_MS` | `30000` | Timeout por request |

## Herramientas (19)

| Tool | Para qué |
|---|---|
| `indec_list_datasets` · `indec_describe_dataset` | Descubrir datasets, columnas y claves (no usan token) |
| `indec_query_dataset` | Consulta genérica: select, filtros, orden, paginación, conteo |
| `indec_count_rows` · `indec_distinct_values` | Contar filas / descubrir valores de una columna |
| `indec_aggregate` | Sumar, promediar o contar agrupando (recorre hasta N filas) |
| `indec_status` | Token configurado y detección de cambios en el spec de la API |
| `indec_ipc` · `indec_canastas` · `indec_salarios` · `indec_precios_mayoristas` · `indec_costo_construccion` | Precios y costos |
| `indec_emae` · `indec_ipi` | Actividad económica e industria |
| `indec_pobreza` · `indec_mercado_trabajo` · `indec_poblacion` | Condiciones de vida y población |
| `indec_comercio_exterior` · `indec_buscar_codigo` | Sector externo (resuelve países y rubros por nombre) |

Las tools de series devuelven **solo el último período** si no se indica `desde`/`hasta` (formatos `AAAA`, `AAAA-MM`, `AAAA-N` para semestres y trimestres).

También expone *resources* (`indec://catalogo`, `indec://dataset/{id}`, `indec://signos-convencionales`, `indec://guia-paginacion`) y *prompts* (`informe-inflacion`, `panorama-economico`, `evolucion-pobreza`, `comercio-exterior-por-pais`).

## Cómo está hecho

- `docs/openapi.snapshot.json` es el spec oficial (público en `GET /v1/`). `npm run gen` genera de él `src/datasets/registry.generated.ts` (columnas, tipos, claves de orden y frecuencia). `npm run gen -- --fetch` actualiza el snapshot desde el INDEC; `indec_status` avisa si el spec remoto cambió.
- Los filtros se validan contra el registry; se manda siempre la clave primaria completa en `order` para que la paginación sea estable; los valores se codifican con `URLSearchParams`.
- Reintentos con backoff ante 429/502/503/504, caché con TTL y deduplicación de requests concurrentes. Se identifica con un `User-Agent` propio.
- Los signos convencionales del INDEC (`*`, `**`, `s`, …) se detectan y se informan junto a los datos.

## Particularidades de la API (verificadas contra datos reales, nov-2026)

- **Columnas `<col>_null`:** cada columna anulable tiene una hermana con el signo convencional cuando el valor es nulo (`valor_FOB=null`, `valor_FOB_null="s"`). **No figuran en el spec**, pero se pueden usar en `select` y filtros. Este servidor las limpia de la salida y las resume en `razon_nulo` / `signos_convencionales`.
- **Períodos de la EPH:** `20261S` (semestre) y `20262T` (trimestre), no `AAAAN`. Los mensuales son `AAAAMM`.
- **Tipos de indicador** en precios y salarios: `Indice`, `v_m` (mensual), `v_ia` (interanual), `v_acum`, `incidencia`; el IPI usa nombres en español. Las tools exponen un parámetro `tipo` amigable que los traduce.
- **Datos confidenciales:** en comercio exterior cerca de la mitad de las filas tienen `s` (secreto estadístico). No suman y se informan como `filas_sin_valor`.
- **Provisorios:** el texto de `observaciones` (ej. «Dato provisorio») se devuelve en `notas`.

## Límites conocidos

- Solo transporte **stdio** (cliente local). No hay servidor HTTP.
- La API del INDEC está en **BETA**: puede cambiar sin aviso. El script de verificación y `indec_status` ayudan a detectarlo.
- Los totales calculados por `indec_aggregate` y `indec_comercio_exterior` son sumas de las filas publicadas y pueden diferir levemente de los informes técnicos del INDEC (redondeo, datos confidenciales).
- El servidor **no interpreta ni valida económicamente** los datos: son lo que publica el INDEC.

## Desarrollo

```bash
npm install
npm test                   # tests unitarios, de contrato con el spec y del servidor con API simulada
npm run typecheck
npm run smoke              # handshake real por stdio, sin token
npm run smoke -- --live    # 1 request real por dataset (requiere INDEC_API_TOKEN)
npm run e2e                # escenarios de agente contra la API real (requiere INDEC_API_TOKEN)
node scripts/verify-live.mjs [distinct|samples|tipos|comercio|signos]   # muestras reales
node scripts/probe.mjs "<ruta?query>"                                   # request crudo a la API
```

Los tests de CI no usan el token: la API se simula (el `smoke` solo consulta el spec público). Las pruebas contra la API real (`smoke --live`, `e2e`) se corren a mano.

## Datos y atribución

Los datos son del **INDEC** (<https://www.indec.gob.ar>), obtenidos de su API pública. Revisá los [términos de la API](https://api.indec.gob.ar/ayuda/terminos) antes de redistribuir datos y citá siempre la fuente. Este proyecto no está afiliado al INDEC ni cuenta con su respaldo.

## Seguridad

Ver [SECURITY.md](SECURITY.md).

## Licencia

[MIT](LICENSE) © 2026 Santino Spingola
