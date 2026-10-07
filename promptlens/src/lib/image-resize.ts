/** Longest side sent to the server, in pixels. */
export const MAX_IMAGE_SIDE = 1600;
/** Photos larger than this are refused before decoding. */
export const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
/** The server accepts at most 4 MB of image bytes. */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

const SOURCE_TYPES: readonly string[] = ['image/jpeg', 'image/png'];
const JPEG_QUALITIES = [0.85, 0.7, 0.55, 0.4];

export type ImageErrorKind = 'type' | 'too-large' | 'unreadable';

export class ImageError extends Error {
  readonly kind: ImageErrorKind;

  constructor(kind: ImageErrorKind) {
    super(kind);
    this.name = 'ImageError';
    this.kind = kind;
  }
}

/** Check a picked file before doing any work on it. */
export function validateImageFile(file: { type: string; size: number }): ImageError | null {
  if (!SOURCE_TYPES.includes(file.type)) return new ImageError('type');
  if (file.size > MAX_SOURCE_BYTES) return new ImageError('too-large');
  return null;
}

/** Scale down to fit `maxSide` on the longest side, keeping the ratio. Never scales up. */
export function computeTargetSize(
  width: number,
  height: number,
  maxSide: number = MAX_IMAGE_SIDE,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxSide) return { width, height };
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return reject(new ImageError('unreadable'));
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new ImageError('unreadable'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize a photo to at most 1600 px and re-encode it as JPEG, returning the
 * bare base64 payload. Re-encoding through a canvas drops all metadata,
 * including EXIF GPS coordinates.
 */
export async function resizeToJpegBase64(file: File): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) throw invalid;

  let bitmap: ImageBitmap;
  try {
    // 'from-image' applies the EXIF rotation before the metadata is dropped.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new ImageError('unreadable');
  }

  try {
    const { width, height } = computeTargetSize(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new ImageError('unreadable');
    // JPEG has no transparency: a transparent PNG would otherwise turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of JPEG_QUALITIES) {
      const blob = await canvasToBlob(canvas, quality);
      if (!blob) throw new ImageError('unreadable');
      if (blob.size <= MAX_UPLOAD_BYTES) return await blobToBase64(blob);
    }
    throw new ImageError('too-large');
  } finally {
    bitmap.close();
  }
}
