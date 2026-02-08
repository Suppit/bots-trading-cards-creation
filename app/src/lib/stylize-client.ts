import { createLogger } from './logger';
import { PORTRAIT_ASPECT_RATIO, PORTRAIT } from './layout-constants';

const log = createLogger('StylizeClient');

/**
 * Crops a source image from its original aspect ratio to 114:97,
 * outputting at the PORTRAIT dimensions (1305×1111) for direct card use.
 */
function cropToPortraitAspect(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const targetAspect = PORTRAIT_ASPECT_RATIO; // 114/97 ≈ 1.175
    const srcAspect = img.width / img.height;

    let sx = 0;
    let sy = 0;
    let sw = img.width;
    let sh = img.height;

    if (srcAspect > targetAspect) {
      // Source is wider — crop horizontally (center crop)
      sw = Math.round(img.height * targetAspect);
      sx = Math.round((img.width - sw) / 2);
    } else {
      // Source is taller — crop vertically (center crop)
      sh = Math.round(img.width / targetAspect);
      sy = Math.round((img.height - sh) / 2);
    }

    const canvas = document.createElement('canvas');
    canvas.width = PORTRAIT.width;   // 1305
    canvas.height = PORTRAIT.height; // 1111

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context for crop'));
      return;
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    log.info('Stylized image cropped to 114:97', {
      sourceSize: `${img.width}x${img.height}`,
      cropRegion: `sx:${sx} sy:${sy} sw:${sw} sh:${sh}`,
      outputSize: `${canvas.width}x${canvas.height}`,
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert cropped canvas to blob'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

/**
 * Loads a base64 string as an HTMLImageElement.
 */
function loadBase64Image(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode stylized image'));
    img.src = `data:image/png;base64,${base64}`;
  });
}

/**
 * Sends the user's photo to the stylization API and returns the
 * stylized + cropped image as a Blob (114:97 at 1305×1111).
 */
export async function stylizePhoto(photoBlob: Blob): Promise<Blob> {
  const photoSizeKB = Math.round(photoBlob.size / 1024);
  log.info('Stylization started', { photoSizeKB });

  const startTime = performance.now();

  // 1. Send to API
  const formData = new FormData();
  formData.append('photo', photoBlob, 'photo.jpg');

  const response = await fetch('/api/stylize', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `Stylization API returned ${response.status}`);
  }

  const data = await response.json();
  if (!data.imageBase64) {
    throw new Error('No image data in stylization response');
  }

  // 2. Decode base64 → Image
  const img = await loadBase64Image(data.imageBase64);

  // 3. Crop from ~16:9 to 114:97
  const croppedBlob = await cropToPortraitAspect(img);

  const totalTimeMs = Math.round(performance.now() - startTime);
  log.info('Stylization complete', {
    totalTimeMs,
    resultSizeKB: Math.round(croppedBlob.size / 1024),
  });

  return croppedBlob;
}
