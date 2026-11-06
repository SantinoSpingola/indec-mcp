---
name: instalar-indec-mcp
description: Instala y configura el MCP del INDEC (indec-mcp) paso a paso para el usuario - revisa si tiene Node.js y npm, le pide permiso antes de instalar nada, lo lleva a la página para conseguir su API key del INDEC, registra el servidor y verifica que funcione. Usala cuando el usuario quiera instalar, configurar o arreglar el MCP del INDEC, cuando pegue el link del repositorio indec-mcp pidiendo instalarlo, o cuando las herramientas indec_* fallen por falta de token (error 401) o porque el servidor no está.
---

# Instalar el MCP del INDEC

Sos quien guía al usuario para dejar funcionando `indec-mcp` (estadísticas oficiales del INDEC de Argentina: inflación, canastas, salarios, EMAE, pobreza, comercio exterior y más). Es un servidor MCP que corre con Node.js y necesita una **API key (token JWT) personal y gratuita** del INDEC.

## Reglas que no se negocian

1. **Nada se instala ni se modifica sin permiso explícito.** Antes de cada paso que cambie algo en la computadora (instalar Node.js, registrar el servidor, abrir el navegador), explicá en una frase qué hace y esperá un «sí». Mostrá el comando exacto antes de correrlo.
2. **El usuario crea su propia cuenta y su propio token.** El registro pide su mail y un código OTP: no lo hagas por él ni le pidas esos datos.
3. **Cuidá el token.** Es personal. Preferí que lo ponga el usuario mismo en una terminal propia (no en este chat). Si igual te lo pega, usalo solo para configurar, no lo repitas en tus respuestas ni lo escribas en ningún archivo del proyecto, y avisale que quedó en la conversación y que puede generar uno nuevo desde **Gestionar la cuenta** (en api.indec.gob.ar) si le preocupa; el anterior deja de valer enseguida.
4. **Hablale simple.** Muchas personas que usan esto no son técnicas. Explicá qué es Node.js y para qué sirve en una línea, sin jerga.

## Paso 1: revisar si tiene Node.js y npm

Detectá el sistema operativo y corré:

```bash
node --version
npm --version
npx --version
```

- Si las tres responden y **Node es 20 o mayor** → seguí al paso 3.
- Si falta alguno o Node es menor a 20 → paso 2.

## Paso 2: instalar Node.js (solo con permiso)

Explicá: «Para que el MCP funcione hace falta Node.js (un programa gratuito que ejecuta el servidor). No lo tenés o es una versión vieja. ¿Querés que te ayude a instalarlo?». **Si dice que no, frená acá** y explicale que sin Node.js no se puede usar el MCP.

Ofrecé estas opciones y que elija (la primera es la más simple y no toca nada sin que él lo vea):

| Opción | Cómo |
|---|---|
| **Instalador oficial (recomendada)** | Que descargue la versión **LTS** desde <https://nodejs.org>, la ejecute y acepte los pasos. Mostrale el link; con su permiso podés abrirlo. |
| **Windows con winget** | `winget install OpenJS.NodeJS.LTS` (con permiso; puede pedirle confirmar en una ventana de Windows) |
| **macOS con Homebrew** | `brew install node` (solo si ya tiene Homebrew) |
| **Linux** | El gestor de su distribución o el instalador oficial. Si necesita `sudo`, que lo corra él. No uses scripts descargados con `curl … \| bash`. |

Después de instalar:
- Puede que la terminal actual no vea Node todavía: pedile que **abra una terminal nueva** (o reinicie Claude Code) y volvé a correr `node --version`. Tiene que mostrar 20 o más.
- Si no aparece, revisá el PATH con él antes de insistir.

## Paso 3: conseguir la API key del INDEC

Explicale que es gratis y que él mismo la genera:

1. Entrar a **<https://api.indec.gob.ar>** y registrarse con su mail.
2. Verificar el mail con el **código OTP** que le llega.
3. Entrar a **Gestionar la cuenta** y generar el token. Que lo **copie y lo guarde en un lugar seguro**. **Vence a los 12 meses**, y si lo pierde puede generar uno nuevo (el anterior deja de valer enseguida).

Preguntale si querés abrirle la página en el navegador y, **si dice que sí**, abrila:

- Windows (PowerShell): `Start-Process "https://api.indec.gob.ar"`
- macOS: `open "https://api.indec.gob.ar"`
- Linux: `xdg-open "https://api.indec.gob.ar"`

Esperá a que te confirme que ya tiene el token. No sigas hasta entonces.

## Paso 4: registrar el MCP

Preguntá qué cliente usa. Lo más probable es Claude Code.

### Claude Code

Armá el comando y **dale al usuario para que lo corra él en una terminal aparte** (así el token no pasa por el chat), reemplazando `PEGA_TU_TOKEN`:

- macOS / Linux / WSL:

  ```bash
  claude mcp add indec --scope user -e INDEC_API_TOKEN=PEGA_TU_TOKEN -- npx -y indec-mcp
  ```

- **Windows (PowerShell o CMD, no WSL):** Claude Code necesita el envoltorio `cmd /c` para `npx`:

  ```powershell
  claude mcp add indec --scope user -e INDEC_API_TOKEN=PEGA_TU_TOKEN -- cmd /c npx -y indec-mcp
  ```

`--scope user` lo deja disponible en todos sus proyectos. Ojo: Claude Code guarda el token **en texto plano** en su archivo de configuración local (`~/.claude.json`); es lo normal en los MCP, pero conviene que el usuario no comparta ese archivo. Si prefiere que lo corras vos y te pasa el token, con su permiso hacelo, sin mostrar el token en tu respuesta.

> **Ojo en Windows:** si lo corrés vos desde la herramienta Bash de Claude Code (que usa Git Bash), el `/c` se convierte solo en `C:/` y queda un registro roto. Corrélo desde **PowerShell** (herramienta PowerShell) o con `MSYS_NO_PATHCONV=1` delante. Después de registrar, mirá con `claude mcp get indec` que los argumentos sean `/c npx -y indec-mcp`.

### Claude Desktop o Cursor

Mostrale este bloque para pegar en la configuración de servidores MCP (Claude Desktop: *Settings → Developer → Edit Config*), con su token en lugar de `PEGA_TU_TOKEN`, y que reinicie la aplicación:

```json
{
  "mcpServers": {
    "indec": {
      "command": "npx",
      "args": ["-y", "indec-mcp"],
      "env": { "INDEC_API_TOKEN": "PEGA_TU_TOKEN" }
    }
  }
}
```

## Paso 5: verificar

1. `claude mcp list` tiene que mostrar `indec` conectado. La primera vez tarda unos segundos porque descarga el paquete.
2. Un servidor agregado a mitad de una sesión puede no aparecer: pedile que lo reconecte con `/mcp` o que reinicie Claude Code.
3. Cuando las herramientas estén disponibles, llamá a `indec_status`: debe devolver `"token_configurado": true`.
4. Hacé una consulta de prueba simple, por ejemplo la inflación mensual más reciente con `indec_ipc`, y mostrale el resultado para que vea que anda. Recordale citar al **INDEC** como fuente.

## Si algo falla

| Síntoma | Causa probable y arreglo |
|---|---|
| `node` o `npx` «no se reconoce» | Terminal abierta antes de instalar Node: abrir una nueva o reiniciar Claude Code |
| Node menor a 20 | Instalar la versión LTS actual desde nodejs.org |
| Error 401 «No autorizado» o `token_configurado: false` | Token mal copiado, vencido o no configurado. Generá uno nuevo en api.indec.gob.ar y volvé a registrar: `claude mcp remove indec` y repetí el paso 4 |
| En Windows el servidor no conecta | Falta `cmd /c` antes de `npx` (solo Claude Code nativo, no WSL) |
| «Connection closed» al iniciar | Probá `npx -y indec-mcp` en una terminal para ver el error real; puede ser un proxy o falta de internet |
| Error 429 o 5xx de la API | El INDEC (la API está en BETA) limita o está caída: esperar y reintentar; el servidor ya reintenta solo |

## Al terminar

Resumí en dos líneas qué quedó instalado y qué puede preguntarle ahora (ejemplos: «¿cuánto fue la inflación de cada mes de 2025?», «mostrame la evolución de la canasta básica», «exportaciones a Brasil por año»). Aclará que es un proyecto no oficial y que los datos pertenecen al INDEC.
