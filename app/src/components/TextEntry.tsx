'use client';

import { useState, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { CHAR_LIMITS } from '@/lib/layout-constants';
import { containsProfanity } from '@/utils/profanity-filter';
import { createLogger } from '@/lib/logger';

const log = createLogger('TextEntry');

interface FieldConfig {
  key: 'title' | 'tagline' | 'funFact' | 'proTip';
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
    placeholder: 'e.g., "Can solve a Rubik\'s cube in under 2 minutes"',
  },
  {
    key: 'proTip',
    label: 'Pro Tip',
    type: 'textarea',
    maxLength: CHAR_LIMITS.proTip,
    placeholder: 'e.g., "Start with the corners, always"',
  },
];

function getCounterColor(length: number, max: number): string {
  if (length >= max) return 'text-red-500';
  if (length > max * 0.8) return 'text-amber-500';
  return 'text-foreground/40';
}

export function TextEntry() {
  const { setStep, setFormData } = useAppContext();

  const [values, setValues] = useState({
    title: '',
    tagline: '',
    funFact: '',
    proTip: '',
  });

  const [profanityErrors, setProfanityErrors] = useState<Record<string, boolean>>({});

  log.info('Text entry screen mounted');

  const handleChange = useCallback(
    (key: FieldConfig['key'], value: string, maxLength: number) => {
      const clamped = value.slice(0, maxLength);
      setValues((prev) => ({ ...prev, [key]: clamped }));

      const hasProfanity = containsProfanity(clamped);
      setProfanityErrors((prev) => ({ ...prev, [key]: hasProfanity }));

      if (hasProfanity) {
        log.warn('Profanity detected', { field: key });
      }

      log.info(`Form field changed: ${key}`, {
        length: clamped.length,
        max: maxLength,
      });
    },
    [],
  );

  const hasProfanity = Object.values(profanityErrors).some(Boolean);
  const isValid = FIELDS.every((f) => values[f.key].trim().length > 0) && !hasProfanity;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      for (const field of FIELDS) {
        if (values[field.key].trim().length === 0) {
          log.warn('Validation failed', {
            field: field.key,
            reason: 'empty',
          });
          return;
        }
        if (containsProfanity(values[field.key])) {
          log.warn('Validation failed', {
            field: field.key,
            reason: 'inappropriate language',
          });
          return;
        }
      }

      log.info('Form submitted successfully');
      setFormData({
        title: values.title.trim(),
        tagline: values.tagline.trim(),
        funFact: values.funFact.trim(),
        proTip: values.proTip.trim(),
      });
      setStep('card-reveal');
    },
    [values, setFormData, setStep],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col items-center gap-5 px-4 py-6"
      data-testid="text-entry-form"
    >
      <h2 className="text-center text-xl font-bold">Add Your Details</h2>

      {FIELDS.map((field) => {
        const value = values[field.key];
        const counterColor = getCounterColor(value.length, field.maxLength);
        const showProfanityError = profanityErrors[field.key];

        return (
          <div key={field.key} className="flex w-full flex-col gap-1">
            <label
              htmlFor={field.key}
              className="text-sm font-semibold text-foreground/70"
            >
              {field.label} *
            </label>

            {field.type === 'input' ? (
              <input
                id={field.key}
                type="text"
                inputMode="text"
                value={value}
                onChange={(e) =>
                  handleChange(field.key, e.target.value, field.maxLength)
                }
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
                onChange={(e) =>
                  handleChange(field.key, e.target.value, field.maxLength)
                }
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
              <span
                className={`text-xs ${counterColor}`}
                data-testid={`counter-${field.key}`}
              >
                {value.length}/{field.maxLength}
              </span>
            </div>
          </div>
        );
      })}

      <button
        type="submit"
        disabled={!isValid}
        className="mt-2 min-h-[48px] w-full rounded-full bg-[#035ba7] px-8 py-3 text-lg font-bold text-white transition-colors hover:bg-[#024a8a] active:bg-[#013d73] disabled:opacity-50"
        data-testid="submit-button"
      >
        Create My Card
      </button>
    </form>
  );
}
