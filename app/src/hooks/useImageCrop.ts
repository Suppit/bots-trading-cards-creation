import { useCallback } from 'react';
import type { PixelCrop } from 'react-image-crop';
import { createLogger } from '@/lib/logger';
import { PORTRAIT_ASPECT_RATIO } from '@/lib/layout-constants';

const log = createLogger('useImageCrop');

export interface CropResult {
  blob: Blob;
  width: number;
  height: number;
}

export function useImageCrop() {
  const extractCrop = useCallback(
    async (
      image: HTMLImageElement,
      crop: PixelCrop,
      displayedWidth: number,
      displayedHeight: number,
    ): Promise<CropResult> => {
      const scaleX = image.naturalWidth / displayedWidth;
      const scaleY = image.naturalHeight / displayedHeight;

      const sourceX = Math.round(crop.x * scaleX);
      const sourceY = Math.round(crop.y * scaleY);
      const sourceW = Math.round(crop.width * scaleX);
      const sourceH = Math.round(crop.height * scaleY);

      // Output width capped at 1305px (portrait mask width at native card resolution)
      const outputW = Math.min(sourceW, 1305);
      const outputH = Math.round(outputW / PORTRAIT_ASPECT_RATIO);

      const canvas = document.createElement('canvas');
      canvas.width = outputW;
      canvas.height = outputH;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, outputW, outputH);

      log.info('Crop extracted', {
        sourceX,
        sourceY,
        sourceW,
        sourceH,
        outputW,
        outputH,
      });

      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob returned null'));
              return;
            }
            resolve({ blob, width: outputW, height: outputH });
          },
          'image/jpeg',
          0.92,
        );
      });
    },
    [],
  );

  return { extractCrop };
}
