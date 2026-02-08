'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PhotoData } from '@/contexts/AppContext';
import { PhotoSelector } from './PhotoCapture/PhotoSelector';
import { PhotoCropper } from './PhotoCapture/PhotoCropper';
import { createLogger } from '@/lib/logger';

const log = createLogger('PhotoCapture');

type SubStep = 'select' | 'crop';

export function PhotoCapture() {
  const { setCroppedPhoto, setStep } = useAppContext();
  const [subStep, setSubStep] = useState<SubStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    log.info('PhotoCapture mounted');
  }, []);

  const handlePhotoSelected = useCallback((file: File) => {
    log.info('Photo selected, moving to crop', {
      name: file.name,
      sizeKB: Math.round(file.size / 1024),
    });
    setSelectedFile(file);
    setSubStep('crop');
  }, []);

  const handleCropComplete = useCallback(
    (photo: PhotoData) => {
      log.info('Crop complete, advancing to text-entry', {
        width: photo.width,
        height: photo.height,
        blobSizeKB: Math.round(photo.blob.size / 1024),
      });
      setCroppedPhoto(photo);
      setStep('text-entry');
    },
    [setCroppedPhoto, setStep],
  );

  const handleBackToSelector = useCallback(() => {
    log.info('User chose to pick a different photo');
    setSelectedFile(null);
    setSubStep('select');
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      {subStep === 'select' && (
        <PhotoSelector onPhotoSelected={handlePhotoSelected} />
      )}
      {subStep === 'crop' && selectedFile && (
        <PhotoCropper
          file={selectedFile}
          onCropComplete={handleCropComplete}
          onBack={handleBackToSelector}
        />
      )}
    </main>
  );
}
