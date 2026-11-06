# Changelog

## 0.1.2

- `indec_aggregate`: el tope de `max_rows` baja de 200.000 a 50.000 filas para no saturar la API del INDEC (que tiene límites de uso por cuenta).
- Documentación: cómo citar la fuente según pide el INDEC («Fuente: INDEC» + servicio de datos), límites de uso, y dónde se genera el token («Gestionar la cuenta»).
- Seguridad: se aclara que Claude Code guarda el token en texto plano en su configuración local.
- Skill de instalación: textos corregidos para coincidir con el portal del INDEC.

## 0.1.1

- Skill de instalación asistida (`instalar-indec-mcp`) distribuida como plugin de Claude Code.
- README: instalación con `npx -y indec-mcp` como opción principal y nota de `cmd /c` para Windows.

## 0.1.0

- Primera versión: 19 datasets, 19 herramientas (genéricas y curadas), resources y prompts. Cliente con reintentos, caché y User-Agent propio; `INDEC_API_BASE_URL` solo acepta HTTPS.
