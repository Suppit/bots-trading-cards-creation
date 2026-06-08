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

export function TextEntry() {
  const { setStep, setFormData, stylizationStatus, resetSession } = useAppContext();

  const [values, setValues] = useState({ title: '', tagline: '', funFact: '', proTip: '' });
  const [profanityErrors, setProfanityErrors] = useState<Record<string, boolean>>({});
  const [bottomFieldIndex, setBottomFieldIndex] = useState(0);

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
      setStep('card-reveal');
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
            {/* Shuffle icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    </main>
  );
}
