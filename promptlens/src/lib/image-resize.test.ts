import { describe, expect, it } from 'vitest';
import { MAX_SOURCE_BYTES, computeTargetSize, validateImageFile } from './image-resize';

describe('computeTargetSize', () => {
  it('scales the longest side down to 1600 px, keeping the ratio', () => {
    expect(computeTargetSize(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(computeTargetSize(3000, 4000)).toEqual({ width: 1200, height: 1600 });
  });

  it('never scales up', () => {
    expect(computeTargetSize(900, 520)).toEqual({ width: 900, height: 520 });
    expect(computeTargetSize(1600, 1600)).toEqual({ width: 1600, height: 1600 });
  });

  it('keeps at least one pixel on a very thin image', () => {
    expect(computeTargetSize(100000, 10)).toEqual({ width: 1600, height: 1 });
  });

  it('accepts another maximum', () => {
    expect(computeTargetSize(2000, 1000, 500)).toEqual({ width: 500, height: 250 });
  });
});

describe('validateImageFile', () => {
  it('accepts JPEG and PNG within the size limit', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: 1000 })).toBeNull();
    expect(validateImageFile({ type: 'image/png', size: MAX_SOURCE_BYTES })).toBeNull();
  });

  it('rejects other types', () => {
    expect(validateImageFile({ type: 'image/gif', size: 1000 })?.kind).toBe('type');
    expect(validateImageFile({ type: 'application/pdf', size: 1000 })?.kind).toBe('type');
    expect(validateImageFile({ type: '', size: 1000 })?.kind).toBe('type');
  });

  it('rejects files over 15 MB', () => {
    expect(validateImageFile({ type: 'image/jpeg', size: MAX_SOURCE_BYTES + 1 })?.kind).toBe('too-large');
  });
});
