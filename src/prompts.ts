import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const user = (text: string) => ({ messages: [{ role: "user" as const, content: { type: "text" as const, text } }] });

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "informe-inflacion",
    { title: "Informe de inflación", description: "Resumen de la inflación más reciente con aperturas.", argsSchema: { region: z.string().optional() } },
    ({ region }) =>
      user(
        `Armá un informe breve de inflación con datos del INDEC. Usá indec_ipc para el último mes (variación mensual, interanual y acumulada del nivel general${region ? ` en la región ${region}` : " a nivel nacional"}), ` +
          "y las 3 divisiones con mayor suba mensual. Citá el período y aclará la fuente (INDEC). No inventes valores: usá solo lo que devuelvan las herramientas.",
      ),
  );
  server.registerPrompt(
    "panorama-economico",
    { title: "Panorama económico", description: "EMAE, IPC, salarios y desempleo en un resumen.", argsSchema: {} },
    () =>
      user(
        "Hacé un panorama económico con el último dato disponible de: EMAE desestacionalizado (indec_emae), IPC mensual e interanual (indec_ipc), índice de salarios (indec_salarios) y desocupación (indec_mercado_trabajo). " +
          "Indicá el período de cada uno (no coinciden) y señalá si algún dato es provisorio/preliminar según los signos convencionales.",
      ),
  );
  server.registerPrompt(
    "evolucion-pobreza",
    { title: "Evolución de la pobreza", description: "Serie semestral de pobreza e indigencia.", argsSchema: { desde: z.string().default("2016") } },
    ({ desde }) => user(`Con indec_pobreza traé desde ${desde} la tasa de pobreza e indigencia en personas y hogares, y describí la evolución semestre a semestre con los picos y mínimos.`),
  );
  server.registerPrompt(
    "comercio-exterior-por-pais",
    { title: "Comercio exterior con un país", description: "Exportaciones e importaciones con un país en un año.", argsSchema: { pais: z.string(), anio: z.string() } },
    ({ pais, anio }) =>
      user(`Con indec_comercio_exterior calculá, para ${pais} en ${anio}, el total de exportaciones (FOB) e importaciones (CIF), el saldo comercial y los 5 principales rubros de exportación (agrupar_por=rubro). Mostrá unidades (USD) y fuente.`),
  );
}
