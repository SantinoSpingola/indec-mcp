# Seguridad

## Cómo se maneja el token

- El token JWT del INDEC se lee **solo** de la variable de entorno `INDEC_API_TOKEN` y se envía únicamente en el header `Authorization` hacia la API configurada.
- El servidor **nunca** escribe el token en logs ni lo incluye en las respuestas a la IA (hay una prueba end-to-end que lo comprueba).
- `INDEC_API_BASE_URL` solo acepta `https://` (o `localhost` para desarrollo), para que el token no viaje sin cifrar.
- No subas tu token a ningún repositorio. `.env` está en `.gitignore`. Si se filtró, generá uno nuevo desde **Gestionar la cuenta** en <https://api.indec.gob.ar> (el anterior deja de servir enseguida).
- Si registrás el servidor con `claude mcp add -e INDEC_API_TOKEN=…`, Claude Code guarda el token **en texto plano** en su archivo de configuración local (`~/.claude.json`), como hacen los clientes MCP en general. No compartas ese archivo ni lo subas a un repositorio.

## Cómo reportar un problema de seguridad

Abrí un [aviso de seguridad privado](https://github.com/SantinoSpingola/indec-mcp/security/advisories/new) en este repositorio. Si preferís no usar GitHub, abrí un issue pidiendo un canal de contacto **sin** incluir detalles de la vulnerabilidad.

## Alcance

Es un servidor local (stdio) que consulta una API pública de solo lectura. No guarda datos en disco, no abre puertos y no ejecuta código recibido de la API.
