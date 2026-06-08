'use client';

import { useCallback, useEffect } from 'react';
import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { PhotoData } from '@/contexts/AppContext';
import { PhotoSelector } from './PhotoCapture/PhotoSelector';
import { PhotoCropper } from './PhotoCapture/PhotoCropper';
import { NavBar } from './NavBar';
import { stylizePhoto } from '@/lib/stylize-client';
import { createLogger } from '@/lib/logger';

const log = createLogger('PhotoCapture');

type SubStep = 'select' | 'crop';

export function PhotoCapture() {
  const {
    setCroppedPhoto,
    setStep,
    setStylizedPhoto,
    setStylizationStatus,
    setStylizationError,
    setPhotoCaptureSubStep,
    resetSession,
  } = useAppContext();

  const [subStep, setSubStep] = useState<SubStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    log.info('PhotoCapture mounted');
  }, []);

  // Keep context in sync so WizardStepper reflects the right step
  useEffect(() => {
    setPhotoCaptureSubStep(subStep);
  }, [subStep, setPhotoCaptureSubStep]);

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
    log.info('User chose a different photo');
    setSelectedFile(null);
    setSubStep('select');
  }, []);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-[64px]">
      <div className="w-full max-w-[448px]">

        <div className="mb-6">
          <NavBar
            onBack={subStep === 'crop' ? handleBackToSelector : undefined}
            onHome={() => {
              log.info('User tapped home from photo-capture');
              resetSession();
            }}
          />
        </div>

        {subStep === 'select' && (
          <PhotoSelector
            onPhotoSelected={handlePhotoSelected}
            onBack={resetSession}
          />
        )}

        {subStep === 'crop' && selectedFile && (
          <PhotoCropper
            file={selectedFile}
            onCropComplete={handleCropComplete}
            onBack={handleBackToSelector}
          />
        )}
      </div>
    </main>
  );
}
