import { z } from 'zod';
import { invalidArgument } from './errors';

export const MAX_TEXT_LENGTH = 2000;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'] as const;
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

/** Message when the whole request body is missing or not an object. */
const BODY_MESSAGE = 'Requête invalide : les données sont obligatoires.';

const textInputSchema = z.object(
  {
    text: z
      .string('Le texte est obligatoire.')
      .trim()
      .min(1, 'Le texte est vide.')
      .max(MAX_TEXT_LENGTH, 'Le texte dépasse 2 000 caractères.'),
  },
  BODY_MESSAGE,
);

const imageInputSchema = z.object(
  {
    imageBase64: z.string('L’image est obligatoire.').min(1, 'L’image est vide.'),
    mimeType: z.enum(IMAGE_MIME_TYPES, 'Format d’image non pris en charge : JPEG ou PNG uniquement.'),
  },
  BODY_MESSAGE,
);

function firstMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Requête invalide.';
}

export function parseTextInput(data: unknown): string {
  const result = textInputSchema.safeParse(data);
  if (!result.success) throw invalidArgument(firstMessage(result.error));
  return result.data.text;
}

export interface ParsedImage {
  base64: string;
  mimeType: ImageMimeType;
  byteLength: number;
}

/** Longest base64 string that can still decode to MAX_IMAGE_BYTES (plus a data: prefix allowance). */
const MAX_BASE64_CHARS = Math.ceil(MAX_IMAGE_BYTES / 3) * 4;
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function detectImageType(bytes: Uint8Array): ImageMimeType | null {
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (startsWith([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  return null;
}

export function parseImageInput(data: unknown): ParsedImage {
  const result = imageInputSchema.safeParse(data);
  if (!result.success) throw invalidArgument(firstMessage(result.error));

  // Accept a data URL prefix and stray whitespace, then work on the bare payload.
  const base64 = result.data.imageBase64.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');

  // Check the size from the string length before decoding anything.
  if (base64.length > MAX_BASE64_CHARS + 4) {
    throw invalidArgument('L’image dépasse 4 Mo.');
  }
  if (base64.length % 4 !== 0 || !BASE64.test(base64)) {
    throw invalidArgument('L’image n’est pas un base64 valide.');
  }

  const bytes = Buffer.from(base64, 'base64');
  if (bytes.byteLength === 0) throw invalidArgument('L’image est vide.');
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw invalidArgument('L’image dépasse 4 Mo.');

  const detected = detectImageType(bytes);
  if (detected === null) {
    throw invalidArgument('Format d’image non pris en charge : JPEG ou PNG uniquement.');
  }
  if (detected !== result.data.mimeType) {
    throw invalidArgument('Le contenu de l’image ne correspond pas au format indiqué.');
  }

  return { base64, mimeType: detected, byteLength: bytes.byteLength };
}
