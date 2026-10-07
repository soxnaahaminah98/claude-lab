export type AiErrorKind =
  /** The server could not be reached (emulator not running, offline). */
  | 'network'
  /** The server rejected the input; `detail` holds its French message. */
  | 'invalid-input'
  | 'unavailable'
  | 'quota'
  /** Not signed in or not allowed. */
  | 'access'
  /** No Firebase project configured, or the server has no Gemini key. */
  | 'not-configured'
  /** The call worked but the answer was unusable. */
  | 'bad-response'
  | 'unknown';

export class AiError extends Error {
  readonly kind: AiErrorKind;
  /** Server-provided French message, only set for `invalid-input` and `bad-response`. */
  readonly detail: string | undefined;

  constructor(kind: AiErrorKind, detail?: string) {
    super(kind);
    this.name = 'AiError';
    this.kind = kind;
    this.detail = detail;
  }
}

/** The Firebase SDK appends " [<http status>]" to every message. */
function stripStatusSuffix(message: string): string {
  return message.replace(/\s*\[\d+\]$/, '');
}

/**
 * Map an error thrown by `httpsCallable` to an `AiError`.
 *
 * The SDK reports a failed request (server down, CORS, offline) as code
 * `functions/internal` with the message "internal [0]". An unhandled server
 * error or a function timeout is "internal [500]". Server-side errors we raise
 * ourselves carry their own French message, so all three can be told apart.
 */
export function mapCallableError(error: unknown): AiError {
  if (typeof error !== 'object' || error === null) return new AiError('unknown');
  const { code, message } = error as { code?: unknown; message?: unknown };
  const rawMessage = typeof message === 'string' ? message : '';
  const text = stripStatusSuffix(rawMessage);

  switch (code) {
    case 'functions/internal':
      // "[0]" is the SDK's marker for "no HTTP response at all".
      if (rawMessage === 'internal [0]') return new AiError('network');
      // Any other bare "internal" is an unhandled server error or a function timeout.
      return text === 'internal' ? new AiError('unavailable') : new AiError('bad-response', text);
    case 'functions/invalid-argument':
      return new AiError('invalid-input', text);
    case 'functions/resource-exhausted':
      return new AiError('quota');
    case 'functions/unavailable':
    case 'functions/deadline-exceeded':
      return new AiError('unavailable');
    case 'functions/unauthenticated':
    case 'functions/permission-denied':
      return new AiError('access');
    case 'functions/failed-precondition':
      return new AiError('not-configured');
    default:
      return new AiError('unknown');
  }
}
