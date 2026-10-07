import * as logger from 'firebase-functions/logger';
import { classifyError, toHttpsError } from './errors';

/**
 * Run one callable body with timing, a privacy-safe log line and French errors.
 *
 * `meta` must only hold non-sensitive facts (sizes, MIME type). Never pass
 * the input text, the image, or anything the model returned.
 */
export async function execute<T>(
  name: string,
  meta: Record<string, string | number>,
  work: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  try {
    const result = await work();
    logger.info(name, { ...meta, outcome: 'ok', durationMs: Date.now() - startedAt });
    return result;
  } catch (error) {
    // Log the error class only: SDK messages can echo parts of the request.
    const classified = classifyError(error);
    logger.warn(name, {
      ...meta,
      outcome: 'error',
      code: classified.code,
      ...(classified.status === undefined ? {} : { upstreamStatus: classified.status }),
      durationMs: Date.now() - startedAt,
    });
    throw toHttpsError(error);
  }
}
