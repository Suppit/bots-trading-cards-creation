'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import {
  validateFileType,
  validateFileSize,
  validateDimensions,
  getImageDimensions,
} from '@/utils/image-validation';

const log = createLogger('PhotoSelector');

type CameraState = 'requesting' | 'active' | 'denied' | 'unavailable';

interface PhotoSelectorProps {
  onPhotoSelected: (file: File) => void;
}

export function PhotoSelector({ onPhotoSelected }: PhotoSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [cameraState, setCameraState] = useState<CameraState>('requesting');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Start camera on mount
  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setCameraState('active');
        log.info('Camera permission: granted');
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);

        if (msg.includes('NotAllowed') || msg.includes('Permission')) {
          setCameraState('denied');
          log.info('Camera permission: denied');
        } else {
          setCameraState('unavailable');
          log.warn('Camera unavailable', { error: msg });
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Connect stream to video element after it renders
  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraState]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera is still starting up. Please try again.');
      log.warn('Capture attempted before video ready', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      });
      return;
    }

    setError(null);
    setLoading(true);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setError('Failed to capture photo.');
      setLoading(false);
      return;
    }

    // Mirror the image horizontally (front camera is mirrored in preview)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    log.info('Photo captured from camera', {
      width: canvas.width,
      height: canvas.height,
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('Failed to capture photo.');
          setLoading(false);
          return;
        }

        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        setLoading(false);

        // Stop camera after capture
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        onPhotoSelected(file);
      },
      'image/jpeg',
      0.92,
    );
  }, [onPhotoSelected]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      setError(null);
      setLoading(true);

      log.info('Image selected from library', {
        name: file.name,
        type: file.type,
        sizeKB: Math.round(file.size / 1024),
      });

      const typeResult = validateFileType(file);
      if (!typeResult.valid) {
        setError(typeResult.error!);
        setLoading(false);
        return;
      }

      const sizeResult = validateFileSize(file);
      if (!sizeResult.valid) {
        setError(sizeResult.error!);
        setLoading(false);
        return;
      }

      try {
        const { width, height } = await getImageDimensions(file);
        log.info('Image dimensions', { width, height });

        const dimResult = validateDimensions(width, height);
        if (!dimResult.valid) {
          setError(dimResult.error!);
          setLoading(false);
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read image.';
        log.error('Image load failed', { error: msg });
        setError(msg);
        setLoading(false);
        return;
      }

      setLoading(false);

      // Stop camera when using library photo
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      onPhotoSelected(file);
    },
    [onPhotoSelected],
  );

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <h2 className="text-xl font-bold">Take a selfie</h2>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for library fallback */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="gallery-input"
      />

      {/* Camera states */}
      {cameraState === 'requesting' && (
        <div className="flex h-64 w-full max-w-md items-center justify-center rounded-2xl bg-foreground/5">
          <p className="text-sm text-foreground/50">Requesting camera access...</p>
        </div>
      )}

      {cameraState === 'active' && (
        <>
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-black"
            style={{ aspectRatio: '114 / 97' }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full -scale-x-100 object-cover"
              data-testid="camera-preview"
            />
          </div>

          <button
            onClick={capturePhoto}
            disabled={loading}
            aria-label="Capture photo"
            className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#035ba7] bg-white transition-transform active:scale-90 disabled:opacity-50"
          >
            <div className="h-12 w-12 rounded-full bg-[#035ba7]" />
          </button>
        </>
      )}

      {(cameraState === 'denied' || cameraState === 'unavailable') && (
        <div className="flex h-64 w-full max-w-md flex-col items-center justify-center gap-3 rounded-2xl bg-foreground/5 px-6">
          <p className="text-center text-sm text-foreground/60">
            {cameraState === 'denied'
              ? 'Camera access was denied. You can upload a photo instead.'
              : 'Camera is not available on this device. You can upload a photo instead.'}
          </p>
          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={loading}
            className="min-h-[48px] min-w-[200px] rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73] disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Upload a Photo'}
          </button>
        </div>
      )}

      {/* Library fallback always visible when camera is active */}
      {cameraState === 'active' && (
        <button
          onClick={() => galleryInputRef.current?.click()}
          disabled={loading}
          className="min-h-[48px] text-sm font-medium text-[#035ba7] underline underline-offset-2 disabled:opacity-50"
        >
          Or choose from library
        </button>
      )}

      {error && (
        <p className="max-w-xs text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
