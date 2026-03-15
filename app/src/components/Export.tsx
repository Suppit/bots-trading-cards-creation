'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('Export');

const supportsShare = (): boolean =>
  typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const supportsFileShare = (): boolean => {
  if (!supportsShare()) return false;
  try {
    return navigator.canShare?.({ files: [new File([], 'test.png', { type: 'image/png' })] }) ?? false;
  } catch {
    return false;
  }
};

export function Export() {
  const { cardDataUrl, setStep } = useAppContext();
  const [shareSupported] = useState(supportsFileShare);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'done' | 'error'>('idle');

  useEffect(() => {
    log.info('Export screen mounted', { shareSupported });
  }, [shareSupported]);

  const handleDownload = useCallback(() => {
    if (!cardDataUrl) return;
    log.info('Export initiated', { format: 'png' });

    const filename = `bots-card-${Date.now()}.png`;
    const link = document.createElement('a');
    link.href = cardDataUrl;
    link.download = filename;
    link.click();

    const sizeKB = Math.round((cardDataUrl.length * 0.75) / 1024);
    log.info('Export complete', { fileSize: `${sizeKB}KB`, filename });
  }, [cardDataUrl]);

  const handleShare = useCallback(async () => {
    if (!cardDataUrl) return;
    log.info('Share initiated');

    setShareStatus('sharing');

    try {
      const res = await fetch(cardDataUrl);
      const blob = await res.blob();
      const filename = `bots-card-${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      await navigator.share({
        title: 'My BOTS Trading Card',
        text: 'Check out my BOTS trading card!',
        files: [file],
      });

      setShareStatus('done');
      log.info('Share completed');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setShareStatus('idle');
        log.info('Share cancelled');
      } else {
        setShareStatus('error');
        const message = err instanceof Error ? err.message : String(err);
        log.error('Share failed', { error: message });
      }
    }
  }, [cardDataUrl]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-6">
      <div className="flex w-full max-w-md flex-col items-center gap-5">

        {/* Back nav */}
        <div className="flex w-full">
          <button
            onClick={() => {
              log.info('User tapped Back from export');
              setStep('card-reveal');
            }}
            className="flex min-h-[44px] items-center gap-1 text-sm font-semibold text-[#035ba7]"
            data-testid="back-button"
          >
            ← Back
          </button>
        </div>

        <h2 className="text-center text-xl font-bold">Your Card is Ready!</h2>

        {/* Card preview */}
        {cardDataUrl ? (
          <div className="w-full overflow-hidden rounded-3xl shadow-lg">
            <img
              src={cardDataUrl}
              alt="Your BOTS trading card"
              className="w-full block"
              style={{ aspectRatio: '1499 / 2098' }}
              data-testid="export-card-image"
            />
          </div>
        ) : (
          <div className="flex w-full items-center justify-center rounded-lg bg-foreground/5 py-16 text-sm text-foreground/40">
            Card not available
          </div>
        )}

        {/* Action buttons */}
        <div className="flex w-full flex-col gap-3">
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!cardDataUrl}
            className="min-h-[48px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73] disabled:opacity-50"
            data-testid="download-button"
          >
            Download Card
          </button>

          {/* Share (only rendered if Web Share API + file share supported) */}
          {shareSupported && (
            <button
              onClick={handleShare}
              disabled={!cardDataUrl || shareStatus === 'sharing'}
              className="min-h-[48px] w-full rounded-full border border-[#035ba7] px-8 py-3 text-lg font-semibold text-[#035ba7] transition-colors hover:bg-[#035ba7]/5 active:bg-[#035ba7]/10 disabled:opacity-50"
              data-testid="share-button"
            >
              {shareStatus === 'sharing' ? 'Sharing…' : 'Share Card'}
            </button>
          )}

          {shareStatus === 'error' && (
            <p className="text-center text-sm text-red-500" role="alert" data-testid="share-error">
              Sharing failed. Try downloading instead.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
