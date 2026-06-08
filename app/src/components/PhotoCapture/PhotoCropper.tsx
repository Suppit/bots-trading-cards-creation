'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import type { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { createLogger } from '@/lib/logger';
import { PORTRAIT_ASPECT_RATIO } from '@/lib/layout-constants';
import { useImageCrop } from '@/hooks/useImageCrop';
import type { PhotoData } from '@/contexts/AppContext';

const log = createLogger('PhotoCropper');

interface PhotoCropperProps {
  file: File;
  onCropComplete: (photo: PhotoData) => void;
  onBack: () => void;
}

export function PhotoCropper({ file, onCropComplete, onBack }: PhotoCropperProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [processing, setProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { extractCrop } = useImageCrop();

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    log.info('Image loaded for cropping', { name: file.name });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const aspect = PORTRAIT_ASPECT_RATIO;

    let cropW: number;
    let cropH: number;
    if (width / height > aspect) {
      cropH = height;
      cropW = cropH * aspect;
    } else {
      cropW = width;
      cropH = cropW / aspect;
    }

    const initialCrop: Crop = {
      unit: 'px',
      x: (width - cropW) / 2,
      y: (height - cropH) / 2,
      width: cropW,
      height: cropH,
    };
    setCrop(initialCrop);
    log.info('Initial crop set', {
      displayedW: width,
      displayedH: height,
      cropW: Math.round(cropW),
      cropH: Math.round(cropH),
    });
  }, []);

  const handleUsePhoto = useCallback(async () => {
    if (!completedCrop || !imgRef.current) return;

    setProcessing(true);
    try {
      const displayedWidth = imgRef.current.width;
      const displayedHeight = imgRef.current.height;

      const result = await extractCrop(
        imgRef.current,
        completedCrop,
        displayedWidth,
        displayedHeight,
      );

      log.info('Crop applied', {
        x: completedCrop.x,
        y: completedCrop.y,
        width: completedCrop.width,
        height: completedCrop.height,
        outputW: result.width,
        outputH: result.height,
        blobSizeKB: Math.round(result.blob.size / 1024),
      });

      const photoData: PhotoData = {
        blob: result.blob,
        width: result.width,
        height: result.height,
        originalWidth: imgRef.current.naturalWidth,
        originalHeight: imgRef.current.naturalHeight,
        originalSizeKB: Math.round(file.size / 1024),
      };

      onCropComplete(photoData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Crop failed';
      log.error('Crop extraction failed', { error: msg });
    } finally {
      setProcessing(false);
    }
  }, [completedCrop, extractCrop, file.size, onCropComplete]);

  if (!imageSrc) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-foreground/50">Loading image...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full text-center">
        <h1 className="mb-2 font-bebas text-4xl sm:text-5xl">
          <span className="heading-gradient">2. Crop Your Photo</span>
        </h1>
        <p className="text-[18px] font-medium text-black">
          Adjust the crop area for your card portrait.
        </p>
      </div>

      <div className="my-4 flex max-h-[60dvh] w-full max-w-md items-center justify-center overflow-hidden">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={PORTRAIT_ASPECT_RATIO}
          minWidth={100}
          minHeight={Math.round(100 / PORTRAIT_ASPECT_RATIO)}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Photo to crop"
            onLoad={handleImageLoad}
            className="max-h-[60dvh] max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3 mt-4">
        <button
          onClick={handleUsePhoto}
          disabled={!completedCrop || processing}
          className="min-h-[52px] w-full rounded-full bg-[#035ba7] px-8 py-4 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73] disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Use This Photo'}
        </button>
        <button
          onClick={onBack}
          disabled={processing}
          className="min-h-[48px] w-full rounded-full border border-black/15 px-8 py-3 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50"
        >
          Choose Different Photo
        </button>
      </div>
    </div>
  );
}
