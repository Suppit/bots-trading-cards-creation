'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { renderCard } from '@/lib/card-renderer';
import { NavBar } from './NavBar';
import { ConfettiBurst } from './ConfettiBurst';
import { Toast } from './Toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('CardReveal');

type RenderState = 'loading' | 'ready' | 'error';

// Card art aspect ratio (all frames are 1499x2098px).
const CARD_ASPECT_RATIO = 1499 / 2098;

// Entrance sequence: card fades in + scales down from a large hero size to
// its resting size, per the Figma "Final reveal" frames (node 84:91 -> 83:1144).
const ENTRANCE_START_HEIGHT = 746;
const ENTRANCE_END_HEIGHT = 497;
const ENTRANCE_START_RADIUS = 33;
const ENTRANCE_END_RADIUS = 22;
const ENTRANCE_START_SHADOW =
  '0px 15px 22.5px -4.5px rgba(0,0,0,0.1), 0px 6px 9px -6px rgba(0,0,0,0.1)';
const ENTRANCE_END_SHADOW = '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -4px rgba(0,0,0,0.1)';
const ENTRANCE_DURATION_MS = 1000;

export function CardReveal() {
  const {
    croppedPhoto,
    stylizedPhoto,
    formData,
    preloadResult,
    setCardDataUrl,
    setStep,
    resetSession,
  } = useAppContext();

  const [renderState, setRenderState] = useState<RenderState>('loading');
  const [localCardDataUrl, setLocalCardDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const entranceStarted = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [cardSettled, setCardSettled] = useState(false);
  const [restUiVisible, setRestUiVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const portrait = stylizedPhoto ?? croppedPhoto?.blob ?? null;
  const frame = preloadResult?.frames.get('specialty') ?? null;

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
      setCardDataUrl(dataUrl);
      setRenderState('ready');
      log.info('Card rendered');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.error('Card render failed', { error: message });
      setErrorMessage(message);
      setRenderState('error');
    }
  }, [portrait, frame, formData, setCardDataUrl]);

  useEffect(() => {
    doRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Final reveal sequence: card fades in + scales down once, then the rest of
  // the UI (nav, heading, buttons) and a confetti burst follow.
  useEffect(() => {
    if (renderState !== 'ready' || entranceStarted.current) return;
    entranceStarted.current = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCardSettled(true);
      setRestUiVisible(true);
      return;
    }

    let settleTimer: ReturnType<typeof setTimeout>;
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        setCardSettled(true);
        settleTimer = setTimeout(() => {
          setRestUiVisible(true);
          setShowConfetti(true);
        }, ENTRANCE_DURATION_MS);
      });
      rafRef.current = raf2;
    });

    return () => {
      cancelAnimationFrame(raf1);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(settleTimer);
    };
  }, [renderState]);

  const handleSave = useCallback(() => {
    if (!localCardDataUrl) return;
    const link = document.createElement('a');
    link.href = localCardDataUrl;
    link.download = `bots-card-${Date.now()}.png`;
    link.click();
    log.info('Card saved/downloaded');
  }, [localCardDataUrl]);

  const handleShare = useCallback(async () => {
    if (!localCardDataUrl) return;
    try {
      const res = await fetch(localCardDataUrl);
      const blob = await res.blob();
      const file = new File([blob], `bots-card-${Date.now()}.png`, { type: 'image/png' });

      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({ files: [file], title: 'My BOTS Trading Card' });
        log.info('Card shared via native share');
        return;
      }
    } catch (err) {
      // AbortError happens when the user cancels the native share sheet — not an error.
      if (err instanceof Error && err.name === 'AbortError') return;
      log.warn('Native share failed, falling back to download', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
    handleSave();
  }, [localCardDataUrl, handleSave]);

  const handleAddToHomePage = useCallback(async () => {
    if (!localCardDataUrl || submitting) return;
    log.info('Add-to-home-page tapped');
    setSubmitting(true);

    try {
      const res = await fetch(localCardDataUrl);
      const blob = await res.blob();

      const form = new FormData();
      form.append('card', blob, `bots-card-${Date.now()}.png`);

      await fetch('/api/submit-card', { method: 'POST', body: form });
      log.info('Card submitted for home page review');
    } catch (err) {
      log.error('Card submission error', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmitting(false);
      setShowToast(true);
    }
  }, [localCardDataUrl, submitting]);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-[64px]">
      <div className="flex w-full max-w-[448px] flex-col items-center gap-8">
        {renderState === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#035ba7] border-t-transparent" />
            <p className="text-sm text-black/50">Generating your card…</p>
          </div>
        )}

        {renderState === 'error' && (
          <div className="flex w-full flex-col gap-6">
            <NavBar
              onBack={() => {
                log.info('User tapped back from card-reveal error state');
                setStep('text-entry');
              }}
              onHome={() => {
                log.info('User tapped home from card-reveal error state');
                resetSession();
              }}
            />
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
          </div>
        )}

        {renderState === 'ready' && localCardDataUrl && (
          <>
            {/* Nav — fades in with the rest of the reveal UI */}
            <div
              className={`w-full transition-opacity duration-500 ease-out ${
                restUiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
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

            {/* Heading — fades in with the rest of the reveal UI */}
            <div
              className={`flex flex-col items-center transition-opacity duration-500 ease-out ${
                restUiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <h1 className="mb-1 font-bebas text-4xl text-center sm:text-5xl">
                <span className="heading-gradient">Check it out!</span>
              </h1>
              <p className="text-center text-sm text-black/50">
                You have made your very own BOTS Card!
              </p>
            </div>

            {/* Card — fades in + scales down once on first reveal */}
            <div
              className="overflow-hidden transition-all ease-out"
              style={{
                height: cardSettled ? ENTRANCE_END_HEIGHT : ENTRANCE_START_HEIGHT,
                width:
                  (cardSettled ? ENTRANCE_END_HEIGHT : ENTRANCE_START_HEIGHT) * CARD_ASPECT_RATIO,
                borderRadius: cardSettled ? ENTRANCE_END_RADIUS : ENTRANCE_START_RADIUS,
                boxShadow: cardSettled ? ENTRANCE_END_SHADOW : ENTRANCE_START_SHADOW,
                opacity: cardSettled ? 1 : 0,
                transitionDuration: `${ENTRANCE_DURATION_MS}ms`,
              }}
            >
              <img
                src={localCardDataUrl}
                alt="Your BOTS trading card"
                className="block h-full w-full object-cover"
                data-testid="card-image"
              />
            </div>

            {/* Action buttons — fade in with the rest of the reveal UI */}
            <div
              className={`flex w-full flex-col gap-3 transition-opacity duration-500 ease-out ${
                restUiVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    log.info('Create another tapped');
                    resetSession();
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 min-h-[40px] rounded-full border border-black/20 bg-white/60 px-4 py-2 text-sm font-medium text-[#323338] transition-all hover:bg-white/90 active:scale-[0.97]"
                  data-testid="create-another-button"
                >
                  {/* Cards icon (from Figma) */}
                  <svg width="10" height="14" viewBox="0 0 9.97861 13.0693" fill="none" aria-hidden="true">
                    <path d="M7.31384 11.9179L7.20931 12.9125L1.49178 12.3115L1.59631 11.317L7.31384 11.9179ZM7.86337 11.4729L8.82729 2.30178C8.85615 2.02724 8.65679 1.78125 8.3823 1.75225L2.66477 1.15131C2.39014 1.12245 2.14411 1.32168 2.11524 1.59631L1.15131 10.7675C1.12245 11.0421 1.32168 11.2881 1.59631 11.317L1.49178 12.3115C0.667894 12.2249 0.0701985 11.4868 0.156793 10.6629L1.12072 1.49178C1.20731 0.667894 1.94541 0.0701985 2.7693 0.156793L8.48683 0.757729L8.63849 0.781525C9.38258 0.937078 9.90299 1.63399 9.82182 2.4063L8.85789 11.5775L8.83409 11.7291C8.68918 12.4239 8.07222 12.9231 7.36261 12.9207L7.20931 12.9125L7.31384 11.9179C7.58836 11.9466 7.83451 11.7475 7.86337 11.4729Z" fill="currentColor"/>
                  </svg>
                  Create another
                </button>

                <button
                  type="button"
                  onClick={handleAddToHomePage}
                  disabled={!localCardDataUrl || submitting}
                  className="flex flex-1 items-center justify-center gap-1.5 min-h-[40px] rounded-full border border-black/20 bg-white/60 px-4 py-2 text-sm font-medium text-[#323338] transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
                  data-testid="add-to-home-button"
                >
                  {/* Cards icon (from Figma) */}
                  <svg width="14" height="14" viewBox="0 0 13.8288 13.0693" fill="none" aria-hidden="true">
                    <path d="M7.31384 11.9179L7.20931 12.9125L1.49178 12.3115L1.59631 11.317L7.31384 11.9179ZM7.86337 11.4729L8.82729 2.30178C8.85615 2.02724 8.65679 1.78125 8.3823 1.75225L2.66477 1.15131C2.39014 1.12245 2.14411 1.32168 2.11524 1.59631L1.15131 10.7675C1.12245 11.0421 1.32168 11.2881 1.59631 11.317L1.49178 12.3115C0.667894 12.2249 0.0701985 11.4868 0.156793 10.6629L1.12072 1.49178C1.20731 0.667894 1.94541 0.0701985 2.7693 0.156793L8.48683 0.757729L8.63849 0.781525C9.38258 0.937078 9.90299 1.63399 9.82182 2.4063L8.85789 11.5775L8.83409 11.7291C8.68918 12.4239 8.07222 12.9231 7.36261 12.9207L7.20931 12.9125L7.31384 11.9179C7.58836 11.9466 7.83451 11.7475 7.86337 11.4729Z" fill="currentColor"/>
                    <path d="M4.76872 0.156879L10.4855 0.758442L10.6379 0.781879C11.3818 0.937566 11.9016 1.63467 11.8205 2.40688L10.8566 11.5778L10.8332 11.7291C10.6883 12.4239 10.0711 12.9239 9.3615 12.9215L9.20818 12.9127L7.9865 12.7838C8.36875 12.609 8.66926 12.2791 8.79704 11.8639L9.31267 11.9186C9.58719 11.9473 9.83362 11.7478 9.86247 11.4733L10.8263 2.30239C10.8552 2.02785 10.6555 1.78158 10.381 1.75258L9.71697 1.68227C9.51435 1.188 9.054 0.818192 8.48552 0.758442L3.98943 0.284809C4.22525 0.176998 4.49217 0.127812 4.76872 0.156879Z" fill="currentColor"/>
                    <path d="M6.76872 0.157853L12.4855 0.758439L12.6379 0.781877C13.3818 0.937514 13.9015 1.63473 13.8205 2.40688L12.8566 11.5788L12.8332 11.7301C12.6882 12.4248 12.0711 12.9239 11.3615 12.9215L11.2082 12.9137L9.9865 12.7848C10.369 12.6099 10.6693 12.2794 10.797 11.8639L11.3127 11.9186C11.587 11.9473 11.8334 11.7486 11.8625 11.4743L12.8263 2.30238C12.8551 2.02794 12.6554 1.78255 12.381 1.75356L11.717 1.68324C11.5145 1.18874 11.0542 0.818209 10.4855 0.758439L5.98943 0.285783C6.2253 0.177904 6.49209 0.128778 6.76872 0.157853Z" fill="currentColor"/>
                  </svg>
                  {submitting ? 'Sending…' : 'Add to our home page'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleShare}
                disabled={!localCardDataUrl}
                className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white shadow-sm transition-all hover:bg-[#024a8a] hover:shadow-md active:scale-[0.98] active:bg-[#013d73] disabled:opacity-50"
                data-testid="share-button"
              >
                {/* ShareFat icon (from Figma) */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M22.2806 9.97031L14.7806 2.47031C14.6758 2.36536 14.5422 2.29385 14.3967 2.26484C14.2512 2.23582 14.1004 2.25059 13.9633 2.30729C13.8263 2.36399 13.7091 2.46006 13.6266 2.58337C13.5441 2.70667 13.5001 2.85166 13.5 3V6.78281C11.0681 6.99094 8.38219 8.18156 6.1725 10.0556C3.51187 12.3131 1.85531 15.2222 1.5075 18.2466C1.48032 18.4817 1.528 18.7194 1.64374 18.9259C1.75949 19.1323 1.93741 19.297 2.15218 19.3965C2.36695 19.496 2.60763 19.5252 2.83997 19.48C3.07231 19.4348 3.28447 19.3175 3.44625 19.1447C4.4775 18.0469 8.14687 14.5753 13.5 14.2697V18C13.5001 18.1483 13.5441 18.2933 13.6266 18.4166C13.7091 18.5399 13.8263 18.636 13.9633 18.6927C14.1004 18.7494 14.2512 18.7642 14.3967 18.7352C14.5422 18.7061 14.6758 18.6346 14.7806 18.5297L22.2806 11.0297C22.4209 10.8891 22.4997 10.6986 22.4997 10.5C22.4997 10.3014 22.4209 10.1109 22.2806 9.97031ZM15 16.1897V13.5C15 13.3011 14.921 13.1103 14.7803 12.9697C14.6397 12.829 14.4489 12.75 14.25 12.75C11.6175 12.75 9.05344 13.4372 6.62906 14.7937C5.39432 15.4877 4.24388 16.322 3.20062 17.28C3.74437 15.045 5.115 12.9197 7.14281 11.1994C9.31969 9.35344 11.9766 8.25 14.25 8.25C14.4489 8.25 14.6397 8.17098 14.7803 8.03033C14.921 7.88968 15 7.69891 15 7.5V4.81125L20.6897 10.5L15 16.1897Z" fill="white"/>
                </svg>
                Share my card
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!localCardDataUrl}
                className="flex min-h-[60px] w-full items-center justify-center gap-2 rounded-full border border-black/20 bg-white px-8 py-3 text-lg font-bold text-[#035ba7] shadow-sm transition-all hover:bg-black/5 hover:shadow-md active:scale-[0.98] disabled:opacity-50"
                data-testid="download-button"
              >
                {/* DownloadSimple icon (from Figma) */}
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M14 9V13C14 13.1326 13.9473 13.2598 13.8536 13.3536C13.7598 13.4473 13.6326 13.5 13.5 13.5H2.5C2.36739 13.5 2.24021 13.4473 2.14645 13.3536C2.05268 13.2598 2 13.1326 2 13V9C2 8.86739 2.05268 8.74021 2.14645 8.64645C2.24021 8.55268 2.36739 8.5 2.5 8.5C2.63261 8.5 2.75979 8.55268 2.85355 8.64645C2.94732 8.74021 3 8.86739 3 9V12.5H13V9C13 8.86739 13.0527 8.74021 13.1464 8.64645C13.2402 8.55268 13.3674 8.5 13.5 8.5C13.6326 8.5 13.7598 8.55268 13.8536 8.64645C13.9473 8.74021 14 8.86739 14 9ZM8.35375 1.64664C8.30731 1.60015 8.25217 1.56327 8.19147 1.53811C8.13077 1.51295 8.06571 1.5 8 1.5C7.93429 1.5 7.86923 1.51295 7.80853 1.53811C7.74783 1.56327 7.69269 1.60015 7.64625 1.64664L5.14625 4.14664C5.0998 4.1931 5.06295 4.24825 5.0378 4.30894C5.01266 4.36964 4.99972 4.4347 4.99972 4.50039C4.99972 4.56609 5.01266 4.63114 5.0378 4.69184C5.06295 4.75254 5.0998 4.80769 5.14625 4.85414C5.19271 4.9006 5.24786 4.93745 5.30855 4.96259C5.36925 4.98773 5.4343 5.00067 5.5 5.00067C5.5657 5.00067 5.63075 4.98773 5.69145 4.96259C5.75215 4.93745 5.8073 4.9006 5.85375 4.85414L7.5 3.20727L7.5 9.00039C7.5 9.133 7.55268 9.26018 7.64645 9.35395C7.74021 9.44771 7.86739 9.50039 8 9.50039C8.13261 9.50039 8.25979 9.44771 8.35355 9.35395C8.44732 9.26018 8.5 9.133 8.5 9.00039L8.5 3.20727L10.1463 4.85414C10.2401 4.94796 10.3673 5.00067 10.5 5.00067C10.6327 5.00067 10.7599 4.94796 10.8538 4.85414C10.9476 4.76032 11.0003 4.63308 11.0003 4.50039C11.0003 4.36771 10.9476 4.24046 10.8538 4.14664L8.35375 1.64664Z" fill="currentColor"/>
                </svg>
                Download card
              </button>
            </div>
          </>
        )}
      </div>

      {showConfetti && <ConfettiBurst onComplete={() => setShowConfetti(false)} />}

      {showToast && (
        <Toast
          message="Your card is being reviewed and will be added to the home page soon"
          onDismiss={() => setShowToast(false)}
          duration={10000}
        />
      )}
    </main>
  );
}
