import { describe, expect, it } from 'vitest';
import { AiError, mapCallableError } from './ai-errors';

function callableError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}

describe('mapCallableError', () => {
  it('recognises an unreachable server (the SDK reports it as "internal [0]")', () => {
    const error = mapCallableError(callableError('functions/internal', 'internal [0]'));
    expect(error).toBeInstanceOf(AiError);
    expect(error.kind).toBe('network');
  });

  it('treats an unhandled server error or a function timeout ("internal [500]") as unavailable, not as network', () => {
    const error = mapCallableError(callableError('functions/internal', 'internal [500]'));
    expect(error.kind).toBe('unavailable');
  });

  it('keeps the French message of a server-side internal error', () => {
    const error = mapCallableError(
      callableError('functions/internal', 'La réponse de l’IA n’a pas pu être interprétée. Réessayez. [500]'),
    );
    expect(error.kind).toBe('bad-response');
    expect(error.detail).toBe('La réponse de l’IA n’a pas pu être interprétée. Réessayez.');
  });

  it('keeps the French message of a rejected input, without the status suffix', () => {
    const error = mapCallableError(callableError('functions/invalid-argument', 'L’image dépasse 4 Mo. [400]'));
    expect(error).toMatchObject({ kind: 'invalid-input', detail: 'L’image dépasse 4 Mo.' });
  });

  it('maps quota, availability, access and configuration errors', () => {
    expect(mapCallableError(callableError('functions/resource-exhausted', 'x')).kind).toBe('quota');
    expect(mapCallableError(callableError('functions/unavailable', 'x')).kind).toBe('unavailable');
    expect(mapCallableError(callableError('functions/deadline-exceeded', 'x')).kind).toBe('unavailable');
    expect(mapCallableError(callableError('functions/unauthenticated', 'x')).kind).toBe('access');
    expect(mapCallableError(callableError('functions/permission-denied', 'x')).kind).toBe('access');
    expect(mapCallableError(callableError('functions/failed-precondition', 'x')).kind).toBe('not-configured');
  });

  it('falls back to unknown without leaking the message', () => {
    const error = mapCallableError(callableError('functions/not-found', 'secret details'));
    expect(error.kind).toBe('unknown');
    expect(error.detail).toBeUndefined();
    expect(mapCallableError('boom').kind).toBe('unknown');
    expect(mapCallableError(undefined).kind).toBe('unknown');
  });
});
