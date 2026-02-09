/**
 * Card layout constants for the BOTS Trading Card Creator.
 *
 * All values are in pixels at the native card resolution (1499×2098).
 * Positions were derived from the reference card templates and finished
 * example cards. Fine-tune these values when testing Canvas rendering.
 *
 * Coordinate system: origin (0, 0) is top-left of the card.
 */

// ---------------------------------------------------------------------------
// Card dimensions
// ---------------------------------------------------------------------------

export const CARD_WIDTH = 1499;
export const CARD_HEIGHT = 2098;

// ---------------------------------------------------------------------------
// Portrait window (where the stylized photo is drawn behind the frame)
// ---------------------------------------------------------------------------

/** Aspect ratio of the portrait mask (width : height = 114 : 97). */
export const PORTRAIT_ASPECT_RATIO = 114 / 97;

export const PORTRAIT = {
  x: 97,
  y: 158,
  width: 1305,
  height: 1111, // 1305 * (97/114) ≈ 1111
} as const;

// ---------------------------------------------------------------------------
// Series metadata
// ---------------------------------------------------------------------------

export type SeriesId = 'series-1' | 'series-2' | 'series-3' | 'series-4' | 'specialty';

export interface SeriesInfo {
  id: SeriesId;
  label: string;
  color: string;
  framePath: string;
}

export const SERIES: SeriesInfo[] = [
  { id: 'series-1', label: 'Series 1', color: '#4A90D9', framePath: '/frames/series-1.png' },
  { id: 'series-2', label: 'Series 2', color: '#D94A6B', framePath: '/frames/series-2.png' },
  { id: 'series-3', label: 'Series 3', color: '#4AD97A', framePath: '/frames/series-3.png' },
  { id: 'series-4', label: 'Series 4', color: '#D9C84A', framePath: '/frames/series-4.png' },
  { id: 'specialty', label: 'Specialty', color: '#A84AD9', framePath: '/frames/specialty.png' },
];

export const CARD_BACK_PATH = '/frames/back.jpg';

// ---------------------------------------------------------------------------
// Font configuration (used for Canvas rendering)
// ---------------------------------------------------------------------------

export const FONTS = {
  family: 'Aileron',
  files: [
    { weight: '400', style: 'normal', path: '/fonts/Aileron-Regular.otf' },
    { weight: '700', style: 'normal', path: '/fonts/Aileron-Bold.otf' },
    { weight: '700', style: 'italic', path: '/fonts/Aileron-BoldItalic.otf' },
  ],
} as const;

// ---------------------------------------------------------------------------
// Text zones — positions & styles for each card text element
//
// fontSize values are px at the native 1499×2098 resolution.
// The reference templates specify 14pt at the Illustrator artboard scale
// (394.56pt wide). Scale factor ≈ 1499 / 394.56 ≈ 3.8, so 14pt → ~53px.
// ---------------------------------------------------------------------------

export const TEXT_ZONES = {
  title: {
    x: 85,
    y: 115,
    maxWidth: 700,
    fontSize: 80,
    fontWeight: '700' as const,
    fontStyle: 'italic' as const,
    color: '#FFFFFF',
    // Title sits on the black diagonal banner at the top of the card
  },

  tagline: {
    x: 97,
    y: 1430,
    maxWidth: 1000,
    fontSize: 53,
    fontWeight: '700' as const,
    fontStyle: 'normal' as const,
    color: '#1A1A1A',
    smallCaps: true,
    bar: {
      path: '/Tagline-Bar.png',
      x: 58,                          // left clip edge (shifted 3px right)
      padding: 80,                    // bar extends 80px past the text
      maxRight: 1402,                 // right edge of portrait frame (97 + 1305)
      height: 126,                    // native bar image height
    },
    // Tagline sits centered in the ribbon area just below the portrait
  },

  funFact: {
    x: 97,
    y: 1630,
    maxWidth: 1305,
    fontSize: 53,
    labelFontWeight: '700' as const,
    bodyFontWeight: '400' as const,
    fontStyle: 'normal' as const,
    color: '#1A1A1A',
    labelSmallCaps: true,
    lineHeight: 1.35,
    label: 'Fun Fact:',
  },

  proTip: {
    x: 97,
    y: 1840,
    maxWidth: 1305,
    fontSize: 53,
    labelFontWeight: '700' as const,
    bodyFontWeight: '400' as const,
    fontStyle: 'normal' as const,
    color: '#1A1A1A',
    labelSmallCaps: true,
    lineHeight: 1.35,
    label: 'Pro Tip:',
  },
} as const;

// ---------------------------------------------------------------------------
// Character limits (for form validation)
// ---------------------------------------------------------------------------

export const CHAR_LIMITS = {
  title: 30,
  tagline: 60,
  funFact: 120,
  proTip: 120,
} as const;
