'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { renderCard } from '@/lib/card-renderer';
import { SERIES } from '@/lib/layout-constants';
import type { SeriesId } from '@/lib/layout-constants';
import { NavBar } from './NavBar';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardReveal');

type RenderState = 'loading' | 'ready' | 'error';

const SERIES_ORDER: SeriesId[] = [
  'specialty',
  'series-1',
  'series-2',
  'series-3',
  'series-4',
];

export function CardReveal() {
  const { croppedPhoto, stylizedPhoto, formData, preloadResult, setStep, setCardDataUrl, resetSession } =
    useAppContext();

  const [renderState, setRenderState] = useState<RenderState>('loading');
  const [localCardDataUrl, setLocalCardDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [seriesIndex, setSeriesIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const portrait = stylizedPhoto ?? croppedPhoto?.blob ?? null;
  const currentSeriesId = SERIES_ORDER[seriesIndex];
  const frame = preloadResult?.frames.get(currentSeriesId) ?? null;
  const currentSeriesLabel = SERIES.find((s) => s.id === currentSeriesId)?.label ?? '';

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
      log.info('Card rendered', { series: currentSeriesId });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('Card render failed', { error: message });
      setErrorMessage(message);
      setRenderState('error');
    }
  }, [portrait, frame, formData, currentSeriesId]);

  useEffect(() => { doRender(); }, [doRender]);

  const navigatePrev = useCallback(() => {
    setSeriesIndex((i) => {
      const next = (i - 1 + SERIES_ORDER.length) % SERIES_ORDER.length;
      log.info('Series changed', { from: SERIES_ORDER[i], to: SERIES_ORDER[next] });
      return next;
    });
  }, []);

  const navigateNext = useCallback(() => {
    setSeriesIndex((i) => {
      const next = (i + 1) % SERIES_ORDER.length;
      log.info('Series changed', { from: SERIES_ORDER[i], to: SERIES_ORDER[next] });
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
      diff > 0 ? navigateNext() : navigatePrev();
    },
    [navigateNext, navigatePrev],
  );

  function handleContinue() {
    log.info('User continuing to export', { series: currentSeriesId });
    if (localCardDataUrl) setCardDataUrl(localCardDataUrl);
    setStep('export');
  }

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-[64px]">
      <div className="w-full max-w-[448px]">

        <div className="mb-6">
          <NavBar
            onBack={() => {
              log.info('User tapped back from card-reveal');
              setStep('text-entry');
            }}
            onHome={() => {
              log.info('User tapped home from card-reveal');
              resetSession();
            }}
          />
        </div>

        {renderState === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#035ba7] border-t-transparent" />
            <p className="text-sm text-black/50">Generating your card…</p>
          </div>
        )}

        {renderState === 'error' && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-sm text-red-600">
              {errorMessage || 'Something went wrong. Let\'s try again.'}
            </p>
            <button
              onClick={doRender}
              className="min-h-[48px] rounded-full bg-[#035ba7] px-8 py-3 text-base font-bold text-white transition-all hover:bg-[#024a8a] active:scale-[0.98]"
            >
              Try again
            </button>
            <button
              onClick={() => setStep('text-entry')}
              className="text-sm font-semibold text-[#035ba7] underline"
            >
              ← Back to details
            </button>
          </div>
        )}

        {renderState === 'ready' && localCardDataUrl && (
          <div className="flex flex-col items-center gap-5">
            {/* Card image with swipe */}
            <div
              className="w-full overflow-hidden rounded-[6%] shadow-[0_8px_40px_rgba(0,0,0,0.18)]"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={localCardDataUrl}
                alt={`Your BOTS trading card — ${currentSeriesLabel}`}
                className="block w-full"
                style={{ aspectRatio: '1499 / 2098' }}
                data-testid="card-image"
              />
            </div>

            {/* Series navigation */}
            <div className="flex w-full items-center justify-between gap-3">
              <button
                onClick={navigatePrev}
                aria-label="Previous series"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white/60 text-xl text-black/60 transition-colors hover:bg-white/90 active:bg-white"
                data-testid="series-prev"
              >
                ‹
              </button>

              <div className="flex items-center gap-2" role="tablist" aria-label="Card series">
                {SERIES_ORDER.map((id, i) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={i === seriesIndex}
                    aria-label={SERIES.find((s) => s.id === id)?.label}
                    onClick={() => {
                      log.info('Series changed via dot', { from: SERIES_ORDER[seriesIndex], to: id });
                      setSeriesIndex(i);
                    }}
                    className={`h-2 rounded-full transition-all ${
                      i === seriesIndex ? 'w-6 bg-[#035ba7]' : 'w-2 bg-black/20 hover:bg-black/40'
                    }`}
                    data-testid={`series-dot-${i}`}
                  />
                ))}
              </div>

              <button
                onClick={navigateNext}
                aria-label="Next series"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-black/15 bg-white/60 text-xl text-black/60 transition-colors hover:bg-white/90 active:bg-white"
                data-testid="series-next"
              >
                ›
              </button>
            </div>

            <p className="text-sm font-semibold text-black/40" data-testid="series-label">
              {currentSeriesLabel}
            </p>

            <button
              onClick={handleContinue}
              className="mt-1 min-h-[52px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white shadow-sm transition-all hover:bg-[#024a8a] hover:shadow-md active:scale-[0.98] active:bg-[#013d73]"
              data-testid="save-button"
            >
              Share this card →
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
