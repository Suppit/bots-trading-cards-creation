'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { renderCard } from '@/lib/card-renderer';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardReveal');

type RenderState = 'loading' | 'ready' | 'error';

export function CardReveal() {
  const { croppedPhoto, stylizedPhoto, formData, preloadResult, setStep } =
    useAppContext();

  const [renderState, setRenderState] = useState<RenderState>('loading');
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const portrait = stylizedPhoto ?? croppedPhoto?.blob ?? null;
  const frame = preloadResult?.frames.get('series-1') ?? null;

  const doRender = useCallback(async () => {
    if (!portrait || !frame || !formData) {
      log.error('Missing data for card render', {
        hasPortrait: !!portrait,
        hasFrame: !!frame,
        hasFormData: !!formData,
      });
      setErrorMessage('Missing photo or text data');
      setRenderState('error');
      return;
    }

    setRenderState('loading');
    setErrorMessage(null);

    try {
      const canvas = await renderCard({ frame, portrait, formData });
      const dataUrl = canvas.toDataURL('image/png');
      setCardDataUrl(dataUrl);
      setRenderState('ready');
      log.info('Card rendered and displayed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('Card rendering failed', { error: message });
      setErrorMessage(message);
      setRenderState('error');
    }
  }, [portrait, frame, formData]);

  useEffect(() => {
    doRender();
  }, [doRender]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-6">
      {renderState === 'loading' && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#035ba7] border-t-transparent" />
          <p className="text-foreground/60">Generating your card...</p>
        </div>
      )}

      {renderState === 'error' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-red-600">
            {errorMessage || 'Something went wrong rendering the card.'}
          </p>
          <button
            onClick={doRender}
            className="min-h-[48px] rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73]"
          >
            Retry
          </button>
          <button
            onClick={() => setStep('text-entry')}
            className="min-h-[48px] rounded-full border border-foreground/20 px-8 py-3 text-lg font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 active:bg-foreground/10"
          >
            Back
          </button>
        </div>
      )}

      {renderState === 'ready' && cardDataUrl && (
        <div className="flex w-full max-w-md flex-col items-center gap-5 animate-in fade-in duration-500">
          <h2 className="text-center text-xl font-bold">Your Card</h2>

          <img
            src={cardDataUrl}
            alt="Your BOTS trading card"
            className="w-full rounded-lg shadow-lg"
            style={{ aspectRatio: '1499 / 2098' }}
          />

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => {
                log.info('User tapped Next from card reveal');
                setStep('series-swipe');
              }}
              className="min-h-[48px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73]"
              data-testid="next-button"
            >
              Choose Series
            </button>
            <button
              onClick={() => {
                log.info('User tapped Back from card reveal');
                setStep('text-entry');
              }}
              className="min-h-[48px] w-full rounded-full border border-foreground/20 px-8 py-3 text-lg font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 active:bg-foreground/10"
              data-testid="back-button"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
