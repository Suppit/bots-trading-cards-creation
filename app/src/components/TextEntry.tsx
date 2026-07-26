'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CHAR_LIMITS } from '@/lib/layout-constants';
import { containsProfanity } from '@/utils/profanity-filter';
import { NavBar } from './NavBar';
import { createLogger } from '@/lib/logger';

const log = createLogger('TextEntry');

const BOTTOM_FIELD_OPTIONS = [
  'Pro Tip',
  'Favorite Food',
  'Favorite Color',
  "What You Don't Know About Me",
] as const;

type BottomFieldOption = (typeof BOTTOM_FIELD_OPTIONS)[number];

const BOTTOM_FIELD_PLACEHOLDERS: Record<BottomFieldOption, string> = {
  'Pro Tip': 'e.g., "Start with the corners, always"',
  'Favorite Food': 'e.g., "Pizza – I could eat it every day!"',
  'Favorite Color': 'e.g., "Ocean blue or sunset orange"',
  "What You Don't Know About Me": 'e.g., "I\'ve visited 12 countries"',
};

interface FieldConfig {
  key: 'title' | 'tagline' | 'funFact';
  label: string;
  type: 'input' | 'textarea';
  maxLength: number;
  placeholder: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: 'title',
    label: 'Title',
    type: 'input',
    maxLength: CHAR_LIMITS.title,
    placeholder: 'e.g., "The Puzzle Master"',
  },
  {
    key: 'tagline',
    label: 'Tagline',
    type: 'input',
    maxLength: CHAR_LIMITS.tagline,
    placeholder: 'e.g., "Always finding the missing piece"',
  },
  {
    key: 'funFact',
    label: 'Fun Fact',
    type: 'textarea',
    maxLength: CHAR_LIMITS.funFact,
    placeholder: "e.g., \"Can solve a Rubik's cube in under 2 minutes\"",
  },
];

function getCounterColor(length: number, max: number): string {
  if (length >= max) return 'text-red-500';
  if (length > max * 0.8) return 'text-amber-500';
  return 'text-black/30';
}

const EXIT_TRANSITION_MS = 400;

export function TextEntry() {
  const { setStep, setFormData, stylizationStatus, resetSession } = useAppContext();

  const [values, setValues] = useState({ title: '', tagline: '', funFact: '', proTip: '' });
  const [profanityErrors, setProfanityErrors] = useState<Record<string, boolean>>({});
  const [bottomFieldIndex, setBottomFieldIndex] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);

  log.info('Text entry screen mounted');

  const currentBottomLabel = BOTTOM_FIELD_OPTIONS[bottomFieldIndex];
  const currentPlaceholder = BOTTOM_FIELD_PLACEHOLDERS[currentBottomLabel];

  const handleChange = useCallback(
    (key: keyof typeof values, value: string, maxLength: number) => {
      const clamped = value.slice(0, maxLength);
      setValues((prev) => ({ ...prev, [key]: clamped }));
      const hasProfanity = containsProfanity(clamped);
      setProfanityErrors((prev) => ({ ...prev, [key]: hasProfanity }));
      if (hasProfanity) log.warn('Profanity detected', { field: key });
      log.info(`Form field changed: ${key}`, { length: clamped.length, max: maxLength });
    },
    [],
  );

  const handleCycleBottomField = useCallback(() => {
    setBottomFieldIndex((prev) => {
      const next = (prev + 1) % BOTTOM_FIELD_OPTIONS.length;
      log.info('Bottom field option selected', { option: BOTTOM_FIELD_OPTIONS[next] });
      return next;
    });
    setValues((prev) => ({ ...prev, proTip: '' }));
    setProfanityErrors((prev) => ({ ...prev, proTip: false }));
  }, []);

  const hasProfanity = Object.values(profanityErrors).some(Boolean);
  const isValid =
    FIELDS.every((f) => values[f.key].trim().length > 0) &&
    values.proTip.trim().length > 0 &&
    !hasProfanity;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      for (const field of FIELDS) {
        if (!values[field.key].trim() || containsProfanity(values[field.key])) {
          log.warn('Validation failed', { field: field.key });
          return;
        }
      }
      if (!values.proTip.trim() || containsProfanity(values.proTip)) {
        log.warn('Validation failed', { field: 'proTip' });
        return;
      }
      log.info('Form submitted successfully');
      setFormData({
        title: values.title.trim(),
        tagline: values.tagline.trim(),
        funFact: values.funFact.trim(),
        proTip: values.proTip.trim(),
        proTipLabel: currentBottomLabel,
      });
      setIsLeaving(true);
      window.setTimeout(() => setStep('card-reveal'), EXIT_TRANSITION_MS);
    },
    [values, currentBottomLabel, setFormData, setStep],
  );

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-[64px]">
      <div className="w-full max-w-[448px]">

        <div className="mb-6">
          <NavBar
            onBack={() => {
              log.info('User tapped back from text-entry to photo-capture');
              setStep('photo-capture');
            }}
            onHome={() => {
              log.info('User tapped home from text-entry');
              resetSession();
            }}
          />
        </div>

        <div
          className={`transition-opacity duration-[400ms] ease-out ${
            isLeaving ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
        {/* Heading */}
        <h1 className="mb-2 font-bebas text-4xl sm:text-5xl text-center">
          <span className="heading-gradient">3. Add Your Details</span>
        </h1>

        {/* Stylization status */}
        {stylizationStatus === 'processing' && (
          <div
            className="mb-4 flex items-center justify-center gap-2 text-sm text-[#035ba7]"
            data-testid="stylization-status"
          >
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#035ba7] border-t-transparent" />
            Stylizing your photo…
          </div>
        )}
        {stylizationStatus === 'complete' && (
          <div className="mb-4 text-center text-sm text-green-600" data-testid="stylization-status">
            Photo stylized!
          </div>
        )}
        {stylizationStatus === 'failed' && (
          <div className="mb-4 text-center text-sm text-amber-600" data-testid="stylization-status">
            Stylization failed — your original photo will be used.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          data-testid="text-entry-form"
        >
          {/* Fixed fields */}
          {FIELDS.map((field) => {
            const value = values[field.key];
            const counterColor = getCounterColor(value.length, field.maxLength);
            const showProfanityError = profanityErrors[field.key];

            return (
              <div key={field.key} className="flex flex-col gap-1">
                <label
                  htmlFor={field.key}
                  className="text-sm font-semibold text-black/70"
                >
                  {field.label} *
                </label>

                {field.type === 'input' ? (
                  <input
                    id={field.key}
                    type="text"
                    inputMode="text"
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value, field.maxLength)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`rounded-xl border bg-white/80 px-3 py-2.5 text-base text-[#171717] placeholder:text-black/25 focus:outline-none focus:ring-2 ${
                      showProfanityError
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-black/15 focus:border-[#035ba7] focus:ring-[#035ba7]/30'
                    }`}
                    data-testid={`field-${field.key}`}
                  />
                ) : (
                  <textarea
                    id={field.key}
                    rows={2}
                    inputMode="text"
                    value={value}
                    onChange={(e) => handleChange(field.key, e.target.value, field.maxLength)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`resize-none rounded-xl border bg-white/80 px-3 py-2.5 text-base text-[#171717] placeholder:text-black/25 focus:outline-none focus:ring-2 ${
                      showProfanityError
                        ? 'border-red-400 focus:ring-red-400'
                        : 'border-black/15 focus:border-[#035ba7] focus:ring-[#035ba7]/30'
                    }`}
                    data-testid={`field-${field.key}`}
                  />
                )}

                <div className="flex items-center justify-between">
                  {showProfanityError ? (
                    <span className="text-xs text-red-500" role="alert" data-testid={`profanity-${field.key}`}>
                      Please use kind words
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className={`text-xs ${counterColor}`} data-testid={`counter-${field.key}`}>
                    {value.length}/{field.maxLength}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Bottom cycling field */}
          <div className="flex flex-col gap-1">
            <label htmlFor="proTip" className="text-sm font-semibold text-black/70">
              {currentBottomLabel} *
            </label>

            <textarea
              id="proTip"
              rows={2}
              inputMode="text"
              value={values.proTip}
              onChange={(e) => handleChange('proTip', e.target.value, CHAR_LIMITS.proTip)}
              placeholder={currentPlaceholder}
              maxLength={CHAR_LIMITS.proTip}
              className={`resize-none rounded-xl border bg-white/80 px-3 py-2.5 text-base text-[#171717] placeholder:text-black/25 focus:outline-none focus:ring-2 ${
                profanityErrors.proTip
                  ? 'border-red-400 focus:ring-red-400'
                  : 'border-black/15 focus:border-[#035ba7] focus:ring-[#035ba7]/30'
              }`}
              data-testid="field-proTip"
            />

            <div className="flex items-center justify-between">
              {profanityErrors.proTip ? (
                <span className="text-xs text-red-500" role="alert" data-testid="profanity-proTip">
                  Please use kind words
                </span>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${getCounterColor(values.proTip.length, CHAR_LIMITS.proTip)}`}
                data-testid="counter-proTip"
              >
                {values.proTip.length}/{CHAR_LIMITS.proTip}
              </span>
            </div>
          </div>

          {/* Ask me a different question — standalone full-width button */}
          <button
            type="button"
            onClick={handleCycleBottomField}
            className="flex w-full items-center justify-center gap-2 min-h-[36px] rounded-full border border-[#035ba7] px-4 py-2 text-sm font-medium text-[#035ba7] transition-opacity hover:opacity-70 active:opacity-50"
            data-testid="different-prompt-button"
            aria-label="Ask a different question"
          >
            {/* Shuffle icon (from Figma) */}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M14.8538 11.1462C14.9002 11.1927 14.9371 11.2478 14.9623 11.3085C14.9874 11.3692 15.0004 11.4343 15.0004 11.5C15.0004 11.5657 14.9874 11.6308 14.9623 11.6915C14.9371 11.7522 14.9002 11.8073 14.8538 11.8537L13.3538 13.3537C13.2599 13.4476 13.1327 13.5003 13 13.5003C12.8673 13.5003 12.7401 13.4476 12.6462 13.3537C12.5524 13.2599 12.4997 13.1327 12.4997 13C12.4997 12.8673 12.5524 12.7401 12.6462 12.6462L13.2931 12H12.5588C11.8426 11.9994 11.1368 11.8282 10.5 11.5005C9.86322 11.1728 9.31365 10.698 8.89688 10.1156L6.28937 6.46562C5.96519 6.01266 5.53775 5.64345 5.04246 5.38857C4.54716 5.1337 3.99827 5.0005 3.44125 5H2C1.86739 5 1.74021 4.94732 1.64645 4.85355C1.55268 4.75978 1.5 4.63261 1.5 4.5C1.5 4.36739 1.55268 4.24021 1.64645 4.14645C1.74021 4.05268 1.86739 4 2 4H3.44125C4.15743 4.00059 4.86316 4.17184 5.49997 4.49953C6.13679 4.82723 6.68635 5.30196 7.10313 5.88437L9.71062 9.53437C10.0348 9.98734 10.4623 10.3566 10.9575 10.6114C11.4528 10.8663 12.0017 10.9995 12.5588 11H13.2931L12.6462 10.3537C12.5524 10.2599 12.4997 10.1327 12.4997 10C12.4997 9.86732 12.5524 9.74007 12.6462 9.64625C12.7401 9.55243 12.8673 9.49972 13 9.49972C13.1327 9.49972 13.2599 9.55243 13.3538 9.64625L14.8538 11.1462ZM8.9375 6.6875C8.99093 6.72567 9.05136 6.75293 9.11533 6.76775C9.1793 6.78256 9.24556 6.78463 9.31033 6.77384C9.3751 6.76304 9.4371 6.73959 9.49281 6.70483C9.54852 6.67007 9.59684 6.62468 9.635 6.57125L9.71 6.46687C10.0341 6.01359 10.4616 5.64409 10.957 5.38899C11.4524 5.13389 12.0015 5.00054 12.5588 5H13.2931L12.6462 5.64625C12.5524 5.74007 12.4997 5.86732 12.4997 6C12.4997 6.13268 12.5524 6.25993 12.6462 6.35375C12.7401 6.44757 12.8673 6.50028 13 6.50028C13.1327 6.50028 13.2599 6.44757 13.3538 6.35375L14.8538 4.85375C14.9002 4.80731 14.9371 4.75217 14.9623 4.69147C14.9874 4.63077 15.0004 4.56571 15.0004 4.5C15.0004 4.43429 14.9874 4.36923 14.9623 4.30853C14.9371 4.24783 14.9002 4.19269 14.8538 4.14625L13.3538 2.64625C13.2599 2.55243 13.1327 2.49972 13 2.49972C12.8673 2.49972 12.7401 2.55243 12.6462 2.64625C12.5524 2.74007 12.4997 2.86732 12.4997 3C12.4997 3.13268 12.5524 3.25993 12.6462 3.35375L13.2931 4H12.5588C11.8426 4.00059 11.1368 4.17184 10.5 4.49953C9.86322 4.82723 9.31365 5.30196 8.89688 5.88437L8.82187 5.98875C8.78348 6.04218 8.75601 6.10267 8.74104 6.16674C8.72607 6.23081 8.7239 6.29721 8.73464 6.36213C8.74538 6.42704 8.76883 6.4892 8.80364 6.54503C8.83845 6.60087 8.88394 6.64928 8.9375 6.6875ZM7.0625 9.3125C7.00907 9.27433 6.94864 9.24706 6.88467 9.23225C6.8207 9.21744 6.75444 9.21537 6.68967 9.22616C6.6249 9.23696 6.56289 9.2604 6.50719 9.29516C6.45148 9.32992 6.40316 9.37532 6.365 9.42875L6.29 9.53312C5.96589 9.98641 5.53841 10.3559 5.04299 10.611C4.54757 10.8661 3.99849 10.9995 3.44125 11H2C1.86739 11 1.74021 11.0527 1.64645 11.1464C1.55268 11.2402 1.5 11.3674 1.5 11.5C1.5 11.6326 1.55268 11.7598 1.64645 11.8536C1.74021 11.9473 1.86739 12 2 12H3.44125C4.15743 11.9994 4.86316 11.8282 5.49997 11.5005C6.13679 11.1728 6.68635 10.698 7.10313 10.1156L7.17812 10.0112C7.21652 9.95781 7.24399 9.89733 7.25896 9.83325C7.27393 9.76918 7.2761 9.70279 7.26536 9.63787C7.25462 9.57296 7.23117 9.5108 7.19636 9.45497C7.16155 9.39913 7.11606 9.35072 7.0625 9.3125Z" fill="currentColor"/>
            </svg>
            Ask me a different question
          </button>

          {/* Actions */}
          <div className="mt-2 flex flex-col gap-3 pb-8">
            <button
              type="submit"
              disabled={!isValid}
              className="min-h-[52px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white shadow-sm transition-all hover:bg-[#024a8a] hover:shadow-md active:scale-[0.98] active:bg-[#013d73] disabled:opacity-50"
              data-testid="submit-button"
            >
              Create my card
            </button>
          </div>
        </form>
        </div>
      </div>
    </main>
  );
}
