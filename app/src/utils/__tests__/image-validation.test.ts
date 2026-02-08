import { describe, it, expect, vi } from 'vitest';
import {
  validateFileType,
  validateFileSize,
  validateDimensions,
  MAX_FILE_SIZE_BYTES,
  MIN_WIDTH,
  MIN_HEIGHT,
} from '../image-validation';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

function createMockFile(name: string, type: string, size: number): File {
  const blob = new Blob(['x'.repeat(Math.min(size, 100))], { type });
  Object.defineProperty(blob, 'size', { value: size });
  Object.defineProperty(blob, 'name', { value: name });
  return blob as File;
}

describe('validateFileType', () => {
  it('accepts JPEG files', () => {
    const file = createMockFile('photo.jpg', 'image/jpeg', 1024);
    expect(validateFileType(file)).toEqual({ valid: true });
  });

  it('accepts PNG files', () => {
    const file = createMockFile('photo.png', 'image/png', 1024);
    expect(validateFileType(file)).toEqual({ valid: true });
  });

  it('accepts WebP files', () => {
    const file = createMockFile('photo.webp', 'image/webp', 1024);
    expect(validateFileType(file)).toEqual({ valid: true });
  });

  it('accepts HEIC by extension when type is empty', () => {
    const file = createMockFile('photo.heic', '', 1024);
    expect(validateFileType(file)).toEqual({ valid: true });
  });

  it('rejects PDF files', () => {
    const file = createMockFile('doc.pdf', 'application/pdf', 1024);
    const result = validateFileType(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('JPEG');
  });

  it('rejects text files', () => {
    const file = createMockFile('notes.txt', 'text/plain', 1024);
    const result = validateFileType(file);
    expect(result.valid).toBe(false);
  });
});

describe('validateFileSize', () => {
  it('accepts files under the limit', () => {
    const file = createMockFile('photo.jpg', 'image/jpeg', 5 * 1024 * 1024);
    expect(validateFileSize(file)).toEqual({ valid: true });
  });

  it('accepts files at exactly the limit', () => {
    const file = createMockFile('photo.jpg', 'image/jpeg', MAX_FILE_SIZE_BYTES);
    expect(validateFileSize(file)).toEqual({ valid: true });
  });

  it('rejects files over the limit', () => {
    const file = createMockFile('photo.jpg', 'image/jpeg', MAX_FILE_SIZE_BYTES + 1);
    const result = validateFileSize(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('20MB');
  });
});

describe('validateDimensions', () => {
  it('accepts valid dimensions', () => {
    expect(validateDimensions(1000, 800)).toEqual({ valid: true });
  });

  it('accepts minimum dimensions', () => {
    expect(validateDimensions(MIN_WIDTH, MIN_HEIGHT)).toEqual({ valid: true });
  });

  it('rejects width too small', () => {
    const result = validateDimensions(100, 800);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small');
  });

  it('rejects height too small', () => {
    const result = validateDimensions(800, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('too small');
  });
});
