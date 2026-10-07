import { HttpsError } from 'firebase-functions/v2/https';
import { describe, expect, it } from 'vitest';
import { MESSAGES, classifyError, toHttpsError } from './errors';

function upstream(status: number, message = 'upstream failure'): Error & { status: number } {
  return Object.assign(new Error(message), { status });
}

describe('classifyError', () => {
  it('passes HttpsError through unchanged', () => {
    const error = new HttpsError('failed-precondition', MESSAGES.keyMissing);
    expect(classifyError(error)).toEqual({ code: 'failed-precondition', message: MESSAGES.keyMissing });
  });

  it('maps rejected keys, including Gemini’s 400 for an invalid key', () => {
    expect(classifyError(upstream(401)).code).toBe('permission-denied');
    expect(classifyError(upstream(403)).code).toBe('permission-denied');
    expect(classifyError(upstream(400, 'API key not valid. Please pass a valid API key.')).code).toBe(
      'permission-denied',
    );
  });

  it('maps quota errors', () => {
    expect(classifyError(upstream(429))).toMatchObject({ code: 'resource-exhausted', status: 429 });
  });

  it('maps server errors and timeouts to unavailable', () => {
    expect(classifyError(upstream(503))).toMatchObject({ code: 'unavailable', status: 503 });
    expect(classifyError(new Error('Request timed out')).code).toBe('unavailable');
    expect(classifyError(new TypeError('fetch failed')).code).toBe('unavailable');
  });

  it('falls back to internal without leaking the upstream message', () => {
    const result = classifyError(upstream(400, 'secret details about the request'));
    expect(result).toMatchObject({ code: 'internal', message: MESSAGES.unknown });
    expect(JSON.stringify(result)).not.toContain('secret details');
  });

  it('handles non-Error values', () => {
    expect(classifyError('boom').code).toBe('internal');
    expect(classifyError(undefined).code).toBe('internal');
  });
});

describe('toHttpsError', () => {
  it('returns an HttpsError with a French message', () => {
    const error = toHttpsError(upstream(429));
    expect(error).toBeInstanceOf(HttpsError);
    expect(error.code).toBe('resource-exhausted');
    expect(error.message).toBe(MESSAGES.quota);
  });
});
