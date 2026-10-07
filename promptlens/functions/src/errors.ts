import { HttpsError } from 'firebase-functions/v2/https';

export type ErrorCode = HttpsError['code'];

export const MESSAGES = {
  keyMissing: 'Clé Gemini non configurée sur le serveur.',
  keyRejected: 'Le service d’IA a refusé l’accès (clé invalide ou non autorisée).',
  quota: 'Le quota du service d’IA est atteint. Réessayez dans quelques minutes.',
  unavailable: 'Le service d’IA est momentanément indisponible. Réessayez.',
  badOutput: 'La réponse de l’IA n’a pas pu être interprétée. Réessayez.',
  unknown: 'Une erreur est survenue lors de l’analyse. Réessayez.',
  signIn: 'Connexion requise.',
} as const;

export function invalidArgument(message: string): HttpsError {
  return new HttpsError('invalid-argument', message);
}

export interface ClassifiedError {
  code: ErrorCode;
  message: string;
  /** Upstream HTTP status when there is one. Safe to log. */
  status?: number;
}

function readStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

function readText(error: unknown): string {
  return error instanceof Error ? `${error.name} ${error.message}`.toLowerCase() : '';
}

/**
 * Map anything thrown while calling Gemini to a French HttpsError code.
 * The raw message is only inspected here, never logged or returned: SDK
 * errors can echo parts of the request.
 */
export function classifyError(error: unknown): ClassifiedError {
  if (error instanceof HttpsError) {
    return { code: error.code, message: error.message };
  }

  const status = readStatus(error);
  const text = readText(error);
  const withStatus = (code: ErrorCode, message: string): ClassifiedError =>
    status === undefined ? { code, message } : { code, message, status };

  // Gemini reports an invalid key as a 400, so look at the text as well.
  if (status === 401 || status === 403 || /api key|api_key|permission/.test(text)) {
    return withStatus('permission-denied', MESSAGES.keyRejected);
  }
  if (status === 429 || /quota|rate limit|resource_exhausted/.test(text)) {
    return withStatus('resource-exhausted', MESSAGES.quota);
  }
  if ((status !== undefined && status >= 500) || /timeout|timed out|abort|econn|enotfound|fetch failed|connection/.test(text)) {
    return withStatus('unavailable', MESSAGES.unavailable);
  }
  return withStatus('internal', MESSAGES.unknown);
}

export function toHttpsError(error: unknown): HttpsError {
  if (error instanceof HttpsError) return error;
  const classified = classifyError(error);
  return new HttpsError(classified.code, classified.message);
}
