'use client';

import { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { BotsLogo } from './BotsLogo';
import { CAROUSEL_IMAGES, CAROUSEL_ROTATIONS } from '@/lib/carousel-images';
import { createLogger } from '@/lib/logger';

const log = createLogger('HomePage');

// Duplicate the array for a seamless infinite loop
const CAROUSEL_ITEMS = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];

const STEPS = [
  {
    number: 1,
    title: 'Add a Photo',
    body: 'Take a selfie or upload a photo from your device. Your photo will be transformed into a unique illustrated portrait.',
  },
  {
    number: 2,
    title: 'Add Your Details',
    body: 'Give your card a title, tagline, fun fact, and a personal touch. These appear right on your finished card.',
  },
  {
    number: 3,
    title: 'Download and Share',
    body: 'Keep this memory for yourself or share your custom BOTS card with the world!',
  },
];

export function HomePage() {
  const {
    isPreloadComplete,
    preloadProgress,
    preloadError,
    setStep,
    retryPreload,
  } = useAppContext();

  useEffect(() => {
    log.info('Home page mounted');
  }, []);

  function handleStart() {
    if (preloadError) {
      retryPreload();
      return;
    }
    if (isPreloadComplete) {
      log.info('Start tapped — navigating to photo-capture');
      setStep('photo-capture');
    }
  }

  const progressPercent = preloadProgress
    ? Math.round(preloadProgress.percent * 100)
    : 0;

  const buttonReady = isPreloadComplete && !preloadError;

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden">

      {/* ── Card carousel ── */}
      <div
        className="relative h-[220px] overflow-hidden sm:h-[280px]"
        aria-hidden="true"
      >
        {/* Edge fade */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white/80 to-transparent"
          style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.85) 0%, transparent 100%)' }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white/80 to-transparent"
          style={{ backgroundImage: 'linear-gradient(to left, rgba(255,255,255,0.85) 0%, transparent 100%)' }}
        />

        <div className="carousel-strip flex h-full items-center gap-4 px-2">
          {CAROUSEL_ITEMS.map((src, i) => {
            const rotation = CAROUSEL_ROTATIONS[i % CAROUSEL_ROTATIONS.length];
            return (
              <div
                key={i}
                className="carousel-card flex-shrink-0"
                style={{ '--rotation': `${rotation}deg` } as React.CSSProperties}
              >
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  className="h-[160px] w-auto rounded-[8px] object-cover shadow-md sm:h-[200px]"
                  style={{ aspectRatio: '1499 / 2098' }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Hero section ── */}
      <section className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
        <BotsLogo className="mb-3 w-36 sm:w-44" />

        <h1 className="mb-6 font-bebas text-4xl sm:text-5xl">
          <span className="heading-gradient">Create Your Trading Card</span>
        </h1>

        <button
          onClick={handleStart}
          disabled={!buttonReady}
          className="w-full sm:w-[481px] min-h-[52px] rounded-full bg-[#035ba7] px-10 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-[#024a8a] hover:shadow-lg active:scale-95 active:bg-[#013d73] disabled:opacity-60 disabled:cursor-not-allowed"
          aria-label={
            preloadError
              ? 'Retry loading'
              : !isPreloadComplete
              ? 'Loading, please wait'
              : 'Create your trading card'
          }
        >
          {preloadError ? 'Retry' : !isPreloadComplete ? 'Loading…' : 'Create your card'}
        </button>

        {/* Loading bar */}
        {!isPreloadComplete && !preloadError && (
          <div className="mt-4 w-48">
            <div className="h-1 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[#035ba7] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-black/40">Loading assets…</p>
          </div>
        )}

        {preloadError && (
          <p className="mt-3 text-center text-sm text-red-500">
            Failed to load. Tap Retry.
          </p>
        )}
      </section>

      {/* ── Preview card ── */}
      <section className="flex justify-center px-6 pb-10" aria-label="Example trading card">
        <div className="w-full max-w-[260px] overflow-hidden rounded-[8%] shadow-[0_8px_40px_rgba(0,0,0,0.18)] sm:max-w-[300px]">
          <img
            src="/home-preview-card.jpg"
            alt="Example BOTS trading card"
            className="block w-full"
            style={{ aspectRatio: '1499 / 2098' }}
          />
        </div>
      </section>

      {/* ── 3 simple steps ── */}
      <section className="flex flex-col items-center px-6 pb-12 text-center">
        <h2 className="mb-2 font-bebas text-3xl sm:text-4xl">
          <span className="heading-gradient">Just 3 Simple Steps</span>
        </h2>
        <p className="mb-10 text-[18px] font-medium text-black">
          Make your very own BOTS Trading Card in minutes
        </p>

        <div className="flex w-full max-w-[520px] flex-col gap-10">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center gap-4">
              {/* Step label */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#035ba7] text-base font-bold text-[#035ba7]">
                  {step.number}
                </div>
                <span className="text-base font-semibold text-[#035ba7]">{step.title}</span>
              </div>

              {/* Placeholder illustration */}
              <div className="h-48 w-full rounded-2xl border border-black/10 bg-white/50 sm:h-56" />

              {/* Body */}
              <p className="text-[18px] font-medium text-black leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="flex flex-col items-center gap-3 px-6 pb-10 text-center">
        <button
          onClick={handleStart}
          disabled={!buttonReady}
          className="w-full sm:w-[481px] min-h-[52px] rounded-full bg-[#035ba7] px-10 py-3 text-lg font-bold text-white shadow-md transition-all hover:bg-[#024a8a] hover:shadow-lg active:scale-95 active:bg-[#013d73] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {preloadError ? 'Retry' : !isPreloadComplete ? 'Loading…' : 'Create your own Card'}
        </button>
      </section>

      {/* ── Footer ── */}
      <footer className="flex justify-center px-6 pb-10 text-center">
        <p className="text-sm text-black/50">
          <a
            href="https://www.bringonthespectrum.org/cards"
            className="text-black/50 no-underline hover:text-black/70"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bring On The Spectrum
          </a>
          {'. ©2026'}
        </p>
      </footer>

    </div>
  );
}
