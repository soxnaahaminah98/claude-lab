import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, MAX_TEXT_LENGTH, detectImageType, parseImageInput, parseTextInput } from './inputs';

const JPEG_HEADER = [0xff, 0xd8, 0xff, 0xe0];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function toBase64(header: number[], totalBytes: number): string {
  const bytes = Buffer.alloc(totalBytes);
  Buffer.from(header).copy(bytes);
  return bytes.toString('base64');
}

function expectInvalid(run: () => unknown, message?: RegExp) {
  try {
    run();
  } catch (error) {
    expect(error).toMatchObject({ code: 'invalid-argument' });
    if (message) expect((error as Error).message).toMatch(message);
    return;
  }
  throw new Error('Expected an invalid-argument error');
}

describe('parseTextInput', () => {
  it('trims and returns the text', () => {
    expect(parseTextInput({ text: '  Portable DEMO-14, écran noir  ' })).toBe('Portable DEMO-14, écran noir');
  });

  it('accepts exactly 2,000 characters and rejects 2,001', () => {
    expect(parseTextInput({ text: 'a'.repeat(MAX_TEXT_LENGTH) })).toHaveLength(MAX_TEXT_LENGTH);
    expectInvalid(() => parseTextInput({ text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }), /2 000/);
  });

  it('rejects missing, non-string and blank text with French messages', () => {
    expectInvalid(() => parseTextInput(undefined), /obligatoire/);
    expectInvalid(() => parseTextInput({}), /obligatoire/);
    expectInvalid(() => parseTextInput({ text: 42 }), /obligatoire/);
    expectInvalid(() => parseTextInput({ text: '   ' }), /vide/);
  });
});

describe('detectImageType', () => {
  it('recognises JPEG and PNG signatures only', () => {
    expect(detectImageType(Uint8Array.from(JPEG_HEADER))).toBe('image/jpeg');
    expect(detectImageType(Uint8Array.from(PNG_HEADER))).toBe('image/png');
    expect(detectImageType(Uint8Array.from([0x47, 0x49, 0x46, 0x38]))).toBeNull();
    expect(detectImageType(new Uint8Array())).toBeNull();
  });
});

describe('parseImageInput', () => {
  it('accepts a JPEG and a PNG', () => {
    const jpeg = parseImageInput({ imageBase64: toBase64(JPEG_HEADER, 100), mimeType: 'image/jpeg' });
    expect(jpeg).toMatchObject({ mimeType: 'image/jpeg', byteLength: 100 });
    const png = parseImageInput({ imageBase64: toBase64(PNG_HEADER, 100), mimeType: 'image/png' });
    expect(png.mimeType).toBe('image/png');
  });

  it('strips a data URL prefix and whitespace', () => {
    const payload = toBase64(PNG_HEADER, 30);
    const withPrefix = `data:image/png;base64,${payload.slice(0, 8)}\n${payload.slice(8)}`;
    expect(parseImageInput({ imageBase64: withPrefix, mimeType: 'image/png' }).base64).toBe(payload);
  });

  it('accepts exactly 4 MB and rejects 4 MB + 1 byte', () => {
    const ok = parseImageInput({ imageBase64: toBase64(PNG_HEADER, MAX_IMAGE_BYTES), mimeType: 'image/png' });
    expect(ok.byteLength).toBe(MAX_IMAGE_BYTES);
    expectInvalid(
      () => parseImageInput({ imageBase64: toBase64(PNG_HEADER, MAX_IMAGE_BYTES + 1), mimeType: 'image/png' }),
      /4 Mo/,
    );
  });

  it('rejects a huge payload before decoding it', () => {
    expectInvalid(() => parseImageInput({ imageBase64: 'A'.repeat(20_000_000), mimeType: 'image/png' }), /4 Mo/);
  });

  it('rejects unsupported declared formats', () => {
    expectInvalid(() => parseImageInput({ imageBase64: toBase64(PNG_HEADER, 50), mimeType: 'image/gif' }), /JPEG ou PNG/);
    expectInvalid(() => parseImageInput({ imageBase64: toBase64(PNG_HEADER, 50) }), /JPEG ou PNG/);
  });

  it('rejects bytes that are not an image, or not the declared image type', () => {
    const text = Buffer.from('not an image at all').toString('base64');
    expectInvalid(() => parseImageInput({ imageBase64: text, mimeType: 'image/png' }), /JPEG ou PNG/);
    expectInvalid(
      () => parseImageInput({ imageBase64: toBase64(PNG_HEADER, 50), mimeType: 'image/jpeg' }),
      /ne correspond pas/,
    );
  });

  it('rejects invalid base64 and empty input', () => {
    expectInvalid(() => parseImageInput({ imageBase64: '%%%not-base64%%%', mimeType: 'image/png' }), /base64/);
    expectInvalid(() => parseImageInput({ imageBase64: 'abc', mimeType: 'image/png' }), /base64/);
    expectInvalid(() => parseImageInput({ imageBase64: '', mimeType: 'image/png' }), /vide/);
    expectInvalid(() => parseImageInput(null), /obligatoire/);
  });
});
