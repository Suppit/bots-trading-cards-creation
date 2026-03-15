'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { renderCard } from '@/lib/card-renderer';
import { SERIES } from '@/lib/layout-constants';
import type { SeriesId } from '@/lib/layout-constants';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardReveal');

type RenderState = 'loading' | 'ready' | 'error';

// Navigation order: Specialty first, then Series 1–4
const SERIES_ORDER: SeriesId[] = [
  'specialty',
  'series-1',
  'series-2',
  'series-3',
  'series-4',
];

export function CardReveal() {
  const { croppedPhoto, stylizedPhoto, formData, preloadResult, setStep, setCardDataUrl } =
    useAppContext();

  const [renderState, setRenderState] = useState<RenderState>('loading');
  const [localCardDataUrl, setLocalCardDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const portrait = stylizedPhoto ?? croppedPhoto?.blob ?? null;
  const currentSeriesId = SERIES_ORDER[seriesIndex];
  const frame = preloadResult?.frames.get(currentSeriesId) ?? null;
  const currentSeriesLabel =
    SERIES.find((s) => s.id === currentSeriesId)?.label ?? '';

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
      setLocalCardDataUrl(dataUrl);
      setRenderState('ready');
      log.info('Card rendered and displayed', { series: currentSeriesId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('Card rendering failed', { error: message });
      setErrorMessage(message);
      setRenderState('error');
    }
  }, [portrait, frame, formData, currentSeriesId]);

  useEffect(() => {
    doRender();
  }, [doRender]);

  const navigatePrev = useCallback(() => {
    setSeriesIndex((i) => {
      const next = (i - 1 + SERIES_ORDER.length) % SERIES_ORDER.length;
      log.info('Series changed', {
        from: SERIES_ORDER[i],
        to: SERIES_ORDER[next],
      });
      return next;
    });
  }, []);

  const navigateNext = useCallback(() => {
    setSeriesIndex((i) => {
      const next = (i + 1) % SERIES_ORDER.length;
      log.info('Series changed', {
        from: SERIES_ORDER[i],
        to: SERIES_ORDER[next],
      });
      return next;
    });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(diff) < 50) return;
      if (diff > 0) {
        navigateNext();
      } else {
        navigatePrev();
      }
    },
    [navigateNext, navigatePrev],
  );

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

      {renderState === 'ready' && localCardDataUrl && (
        <div className="flex w-full max-w-md flex-col items-center gap-5 animate-in fade-in duration-500">
          <h2 className="text-center text-xl font-bold">Your Card</h2>

          {/* Card image with swipe support */}
          <div
            className="w-full overflow-hidden rounded-[6%] shadow-lg"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={localCardDataUrl}
              alt={`Your BOTS trading card — ${currentSeriesLabel}`}
              className="w-full block"
              style={{ aspectRatio: '1499 / 2098' }}
              data-testid="card-image"
            />
          </div>

          {/* Series navigation */}
          <div className="flex w-full items-center justify-between gap-3">
            <button
              onClick={navigatePrev}
              aria-label="Previous series"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-foreground/20 text-xl text-foreground/70 transition-colors hover:bg-foreground/5 active:bg-foreground/10"
              data-testid="series-prev"
            >
              ‹
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-2" role="tablist" aria-label="Card series">
              {SERIES_ORDER.map((id, i) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={i === seriesIndex}
                  aria-label={SERIES.find((s) => s.id === id)?.label}
                  onClick={() => {
                    const prev = seriesIndex;
                    log.info('Series changed via dot', { from: SERIES_ORDER[prev], to: id });
                    setSeriesIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === seriesIndex
                      ? 'w-6 bg-[#035ba7]'
                      : 'w-2 bg-foreground/20 hover:bg-foreground/40'
                  }`}
                  data-testid={`series-dot-${i}`}
                />
              ))}
            </div>

            <button
              onClick={navigateNext}
              aria-label="Next series"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-foreground/20 text-xl text-foreground/70 transition-colors hover:bg-foreground/5 active:bg-foreground/10"
              data-testid="series-next"
            >
              ›
            </button>
          </div>

          <p className="text-sm font-semibold text-foreground/50" data-testid="series-label">
            {currentSeriesLabel}
          </p>

          {/* Action buttons */}
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => {
                log.info('User tapped Save Card from card reveal', { series: currentSeriesId });
                if (localCardDataUrl) setCardDataUrl(localCardDataUrl);
                setStep('export');
              }}
              className="min-h-[48px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73]"
              data-testid="save-button"
            >
              Save Card
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
