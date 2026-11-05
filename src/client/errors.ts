export class IndecApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly hint?: string | null,
    readonly details?: string | null,
  ) {
    super(message);
    this.name = "IndecApiError";
  }

  /** Mensaje pensado para que lo lea un agente/usuario y sepa qué hacer. */
  toUserMessage(): string {
    switch (this.status) {
      case 401:
        return (
          "401 No autorizado: falta el token o es inválido/vencido. Definí INDEC_API_TOKEN con un JWT generado en " +
          "https://api.indec.gob.ar (perfil → generar token; vence a los 12 meses y regenerarlo invalida el anterior)."
        );
      case 403:
        return "403 Prohibido: el token no tiene permisos sobre este recurso.";
      case 400:
        return `400 Consulta inválida (${this.code ?? "sin código"}): ${this.message}${this.hint ? ` — pista: ${this.hint}` : ""}`;
      case 429:
        return "429 Demasiadas consultas: se superó el límite de uso de la API. Reintentá en unos minutos.";
      default:
        return `Error ${this.status}${this.code ? ` (${this.code})` : ""}: ${this.message}`;
    }
  }
}

/** Error de validación de parámetros de entrada (antes de llamar a la API). */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}
