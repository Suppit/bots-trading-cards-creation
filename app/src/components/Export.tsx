'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { NavBar } from './NavBar';
import { Toast } from './Toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('Export');

export function Export() {
  const { cardDataUrl, setStep, resetSession } = useAppContext();
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    log.info('Export screen mounted');
  }, []);

  const handleSave = useCallback(() => {
    if (!cardDataUrl) return;
    const link = document.createElement('a');
    link.href = cardDataUrl;
    link.download = `bots-card-${Date.now()}.png`;
    link.click();
    log.info('Card saved/downloaded');
  }, [cardDataUrl]);

  const handleAddToHomePage = useCallback(async () => {
    if (!cardDataUrl || submitting) return;
    log.info('Add-to-home-page tapped');
    setSubmitting(true);

    try {
      const res = await fetch(cardDataUrl);
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
  }, [cardDataUrl, submitting]);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-[64px]">
      <div className="w-full max-w-[448px]">

        <div className="mb-6">
          <NavBar
            onBack={() => {
              log.info('User tapped back from export');
              setStep('card-reveal');
            }}
            onHome={() => {
              log.info('User tapped home from export');
              resetSession();
            }}
          />
        </div>

        {/* Heading */}
        <h1 className="mb-1 font-bebas text-4xl text-center sm:text-5xl">
          <span className="heading-gradient">Check it out!</span>
        </h1>
        <p className="mb-6 text-center text-sm text-black/50">You have made your very own BOTS Card!</p>

        {/* Card preview */}
        {cardDataUrl ? (
          <div className="mb-6 w-full overflow-hidden rounded-[6%] shadow-[0_8px_40px_rgba(0,0,0,0.18)]">
            <img
              src={cardDataUrl}
              alt="Your BOTS trading card"
              className="block w-full"
              style={{ aspectRatio: '1499 / 2098' }}
              data-testid="export-card-image"
            />
          </div>
        ) : (
          <div className="mb-6 flex h-64 w-full items-center justify-center rounded-2xl bg-black/5 text-sm text-black/40">
            Card not available
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pb-8">

          {/* Tertiary row */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                log.info('Create another tapped');
                resetSession();
              }}
              className="flex flex-1 items-center justify-center gap-1.5 min-h-[40px] rounded-full border border-black/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#171717] transition-all hover:bg-white/90 active:scale-[0.97]"
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
              disabled={!cardDataUrl || submitting}
              className="flex flex-1 items-center justify-center gap-1.5 min-h-[40px] rounded-full border border-black/15 bg-white/60 px-4 py-2 text-sm font-semibold text-[#171717] transition-all hover:bg-white/90 active:scale-[0.97] disabled:opacity-50"
              data-testid="add-to-home-button"
            >
              {/* Cards icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="2" y="6" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {submitting ? 'Sending…' : 'Add to our home page'}
            </button>
          </div>

          {/* Primary save button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={!cardDataUrl}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white shadow-sm transition-all hover:bg-[#024a8a] hover:shadow-md active:scale-[0.98] active:bg-[#013d73] disabled:opacity-50"
            data-testid="download-button"
          >
            {/* DownloadSimple icon (from Figma) */}
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14 9V13C14 13.1326 13.9473 13.2598 13.8536 13.3536C13.7598 13.4473 13.6326 13.5 13.5 13.5H2.5C2.36739 13.5 2.24021 13.4473 2.14645 13.3536C2.05268 13.2598 2 13.1326 2 13V9C2 8.86739 2.05268 8.74021 2.14645 8.64645C2.24021 8.55268 2.36739 8.5 2.5 8.5C2.63261 8.5 2.75979 8.55268 2.85355 8.64645C2.94732 8.74021 3 8.86739 3 9V12.5H13V9C13 8.86739 13.0527 8.74021 13.1464 8.64645C13.2402 8.55268 13.3674 8.5 13.5 8.5C13.6326 8.5 13.7598 8.55268 13.8536 8.64645C13.9473 8.74021 14 8.86739 14 9ZM8.35375 1.64664C8.30731 1.60015 8.25217 1.56327 8.19147 1.53811C8.13077 1.51295 8.06571 1.5 8 1.5C7.93429 1.5 7.86923 1.51295 7.80853 1.53811C7.74783 1.56327 7.69269 1.60015 7.64625 1.64664L5.14625 4.14664C5.0998 4.1931 5.06295 4.24825 5.0378 4.30894C5.01266 4.36964 4.99972 4.4347 4.99972 4.50039C4.99972 4.56609 5.01266 4.63114 5.0378 4.69184C5.06295 4.75254 5.0998 4.80769 5.14625 4.85414C5.19271 4.9006 5.24786 4.93745 5.30855 4.96259C5.36925 4.98773 5.4343 5.00067 5.5 5.00067C5.5657 5.00067 5.63075 4.98773 5.69145 4.96259C5.75215 4.93745 5.8073 4.9006 5.85375 4.85414L7.5 3.20727L7.5 9.00039C7.5 9.133 7.55268 9.26018 7.64645 9.35395C7.74021 9.44771 7.86739 9.50039 8 9.50039C8.13261 9.50039 8.25979 9.44771 8.35355 9.35395C8.44732 9.26018 8.5 9.133 8.5 9.00039L8.5 3.20727L10.1463 4.85414C10.2401 4.94796 10.3673 5.00067 10.5 5.00067C10.6327 5.00067 10.7599 4.94796 10.8538 4.85414C10.9476 4.76032 11.0003 4.63308 11.0003 4.50039C11.0003 4.36771 10.9476 4.24046 10.8538 4.14664L8.35375 1.64664Z" fill="currentColor"/>
            </svg>
            Save your card
          </button>
        </div>
      </div>

      {/* Toast notification */}
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
