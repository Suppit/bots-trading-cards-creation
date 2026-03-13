'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PhotoData } from '@/contexts/AppContext';
import { PhotoSelector } from './PhotoCapture/PhotoSelector';
import { PhotoCropper } from './PhotoCapture/PhotoCropper';
import { stylizePhoto } from '@/lib/stylize-client';
import { createLogger } from '@/lib/logger';

const log = createLogger('PhotoCapture');

type SubStep = 'select' | 'crop';

export function PhotoCapture() {
  const { setCroppedPhoto, setStep, setStylizedPhoto, setStylizationStatus, setStylizationError } = useAppContext();
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

      // Fire stylization in the background while user fills out text entry
      setStylizationStatus('processing');
      setStylizationError(null);
      stylizePhoto(photo.blob)
        .then((stylizedBlob) => {
          setStylizedPhoto(stylizedBlob);
          setStylizationStatus('complete');
          log.info('Stylization complete in background');
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          setStylizationStatus('failed');
          setStylizationError(message);
          log.error('Stylization failed, will use original photo', { error: message });
        });

      setStep('text-entry');
    },
    [setCroppedPhoto, setStep, setStylizedPhoto, setStylizationStatus, setStylizationError],
  );

  const handleBackToSelector = useCallback(() => {
    log.info('User chose to pick a different photo');
    setSelectedFile(null);
    setSubStep('select');
  }, []);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-4 w-full max-w-md rounded-lg bg-foreground/5 px-4 py-2 text-center text-xs text-foreground/50">
        Photos are processed by AI. No photos are stored or shared.
      </div>
      {subStep === 'select' && (
        <PhotoSelector
          onPhotoSelected={handlePhotoSelected}
          onBack={() => {
            log.info('User tapped Back from photo-capture to start');
            setStep('start');
          }}
        />
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
