import { createLogger } from '@/lib/logger';

const log = createLogger('ImageValidation');

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB
export const MIN_WIDTH = 300;
export const MIN_HEIGHT = 255; // ~300 * (97/114)

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFileType(file: File): ValidationResult {
  const type = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ACCEPTED_TYPES.includes(type) || ext === 'heic' || ext === 'heif') {
    return { valid: true };
  }

  log.warn('Invalid file type', { type, name: file.name });
  return { valid: false, error: 'Please select a JPEG, PNG, or WebP image.' };
}

export function validateFileSize(file: File): ValidationResult {
  if (file.size <= MAX_FILE_SIZE_BYTES) {
    return { valid: true };
  }

  const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
  log.warn('File too large', { sizeBytes: file.size, sizeMB });
  return { valid: false, error: `Image is too large (${sizeMB}MB). Maximum is 20MB.` };
}

export function validateDimensions(width: number, height: number): ValidationResult {
  if (width >= MIN_WIDTH && height >= MIN_HEIGHT) {
    return { valid: true };
  }

  log.warn('Image too small', { width, height });
  return {
    valid: false,
    error: `Image is too small (${width}x${height}). Minimum is ${MIN_WIDTH}x${MIN_HEIGHT}.`,
  };
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image.'));
    };
    img.src = url;
  });
}
