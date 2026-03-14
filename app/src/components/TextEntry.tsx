'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CHAR_LIMITS } from '@/lib/layout-constants';
import { containsProfanity } from '@/utils/profanity-filter';
import { createLogger } from '@/lib/logger';

const log = createLogger('TextEntry');

// ---------------------------------------------------------------------------
// Bottom field prompt cycling
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fixed fields (title, tagline, fun fact)
// ---------------------------------------------------------------------------

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
  return 'text-foreground/40';
}

export function TextEntry() {
  const { setStep, setFormData, stylizationStatus } = useAppContext();

  const [values, setValues] = useState({
    title: '',
    tagline: '',
    funFact: '',
    proTip: '',
  });

  const [profanityErrors, setProfanityErrors] = useState<Record<string, boolean>>({});
  const [bottomFieldIndex, setBottomFieldIndex] = useState(0);
  const [buttonPressed, setButtonPressed] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  log.info('Text entry screen mounted');

  const currentBottomLabel = BOTTOM_FIELD_OPTIONS[bottomFieldIndex];
  const currentPlaceholder = BOTTOM_FIELD_PLACEHOLDERS[currentBottomLabel];

  const handleChange = useCallback(
    (key: keyof typeof values, value: string, maxLength: number) => {
      const clamped = value.slice(0, maxLength);
      setValues((prev) => ({ ...prev, [key]: clamped }));

      const hasProfanity = containsProfanity(clamped);
      setProfanityErrors((prev) => ({ ...prev, [key]: hasProfanity }));

      if (hasProfanity) {
        log.warn('Profanity detected', { field: key });
      }

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
    // Clear the bottom field value when switching prompts
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
        if (values[field.key].trim().length === 0) {
          log.warn('Validation failed', { field: field.key, reason: 'empty' });
          return;
        }
        if (containsProfanity(values[field.key])) {
          log.warn('Validation failed', { field: field.key, reason: 'inappropriate language' });
          return;
        }
      }
      if (values.proTip.trim().length === 0) {
        log.warn('Validation failed', { field: 'proTip', reason: 'empty' });
        return;
      }
      if (containsProfanity(values.proTip)) {
        log.warn('Validation failed', { field: 'proTip', reason: 'inappropriate language' });
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

  // Button visual state classes
  const buttonBg = buttonPressed
    ? 'bg-[rgba(103,104,121,0.25)]'
    : buttonHovered
      ? 'bg-[rgba(103,104,121,0.18)]'
      : 'bg-[rgba(103,104,121,0.1)]';

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 py-6"
      data-testid="text-entry-form"
    >
      <h2 className="text-center text-xl font-bold">Add Your Details</h2>

      {stylizationStatus === 'processing' && (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm text-[#035ba7]" data-testid="stylization-status">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#035ba7] border-t-transparent" />
          Stylizing your photo...
        </div>
      )}
      {stylizationStatus === 'complete' && (
        <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700" data-testid="stylization-status">
          Photo stylized!
        </div>
      )}
      {stylizationStatus === 'failed' && (
        <div className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700" data-testid="stylization-status">
          Stylization failed. Your original photo will be used.
        </div>
      )}

      {/* Fixed fields: Title, Tagline, Fun Fact */}
      {FIELDS.map((field) => {
        const value = values[field.key];
        const counterColor = getCounterColor(value.length, field.maxLength);
        const showProfanityError = profanityErrors[field.key];

        return (
          <div key={field.key} className="flex w-full flex-col gap-1">
            <label htmlFor={field.key} className="text-sm font-semibold text-foreground/70">
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
                className={`rounded-lg border bg-white px-3 py-2 text-base text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
                  showProfanityError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-foreground/20 focus:border-[#035ba7] focus:ring-[#035ba7]'
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
                className={`resize-none rounded-lg border bg-white px-3 py-2 text-base text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
                  showProfanityError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-foreground/20 focus:border-[#035ba7] focus:ring-[#035ba7]'
                }`}
                data-testid={`field-${field.key}`}
              />
            )}

            <div className="flex items-center justify-between">
              {showProfanityError ? (
                <span className="text-xs text-red-500" role="alert" data-testid={`profanity-${field.key}`}>
                  Please remove inappropriate language
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

      {/* Bottom field: cycling prompt */}
      <div className="flex w-full flex-col gap-1">
        {/* Label row with "Different prompt" button */}
        <div className="flex items-center justify-between">
          <label htmlFor="proTip" className="text-sm font-semibold text-foreground/70">
            {currentBottomLabel} *
          </label>

          <button
            type="button"
            onClick={handleCycleBottomField}
            onMouseEnter={() => setButtonHovered(true)}
            onMouseLeave={() => { setButtonHovered(false); setButtonPressed(false); }}
            onMouseDown={() => setButtonPressed(true)}
            onMouseUp={() => setButtonPressed(false)}
            className={`flex h-[24px] cursor-pointer items-center gap-1.5 rounded-[4px] px-2 transition-colors ${buttonBg}`}
            data-testid="different-prompt-button"
            aria-label="Cycle to different prompt"
          >
            <span className="text-[13px] font-normal text-foreground/30">Different prompt</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M3.5 2L6.5 5L3.5 8" stroke="rgba(23,23,23,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <textarea
          id="proTip"
          rows={2}
          inputMode="text"
          value={values.proTip}
          onChange={(e) => handleChange('proTip', e.target.value, CHAR_LIMITS.proTip)}
          placeholder={currentPlaceholder}
          maxLength={CHAR_LIMITS.proTip}
          className={`resize-none rounded-lg border bg-white px-3 py-2 text-base text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 ${
            profanityErrors.proTip
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
              : 'border-foreground/20 focus:border-[#035ba7] focus:ring-[#035ba7]'
          }`}
          data-testid="field-proTip"
        />

        <div className="flex items-center justify-between">
          {profanityErrors.proTip ? (
            <span className="text-xs text-red-500" role="alert" data-testid="profanity-proTip">
              Please remove inappropriate language
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

      <div className="mt-2 flex w-full flex-col gap-3">
        <button
          type="submit"
          disabled={!isValid}
          className="min-h-[48px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73] disabled:opacity-50"
          data-testid="submit-button"
        >
          Create My Card
        </button>
        <button
          type="button"
          onClick={() => {
            log.info('User tapped Back from text entry');
            setStep('photo-capture');
          }}
          className="min-h-[48px] w-full rounded-full border border-foreground/20 px-8 py-3 text-lg font-semibold text-foreground/70 transition-colors hover:bg-foreground/5 active:bg-foreground/10"
          data-testid="back-button"
        >
          Back
        </button>
      </div>
    </form>
  );
}
