import { describe, it, expect } from 'vitest';
import {
  CARD_WIDTH,
  CARD_HEIGHT,
  PORTRAIT,
  PORTRAIT_ASPECT_RATIO,
  SERIES,
  CARD_BACK_PATH,
  FONTS,
  TEXT_ZONES,
  CHAR_LIMITS,
} from '../layout-constants';

describe('layout-constants', () => {
  it('defines correct card dimensions', () => {
    expect(CARD_WIDTH).toBe(1499);
    expect(CARD_HEIGHT).toBe(2098);
  });

  it('portrait aspect ratio matches 114:97', () => {
    expect(PORTRAIT_ASPECT_RATIO).toBeCloseTo(114 / 97, 4);
  });

  it('portrait dimensions respect the 114:97 aspect ratio', () => {
    const actualRatio = PORTRAIT.width / PORTRAIT.height;
    expect(actualRatio).toBeCloseTo(PORTRAIT_ASPECT_RATIO, 1);
  });

  it('portrait fits within card bounds', () => {
    expect(PORTRAIT.x).toBeGreaterThanOrEqual(0);
    expect(PORTRAIT.y).toBeGreaterThanOrEqual(0);
    expect(PORTRAIT.x + PORTRAIT.width).toBeLessThanOrEqual(CARD_WIDTH);
    expect(PORTRAIT.y + PORTRAIT.height).toBeLessThanOrEqual(CARD_HEIGHT);
  });

  it('defines all 5 series with required fields', () => {
    expect(SERIES).toHaveLength(5);
    for (const series of SERIES) {
      expect(series.id).toBeTruthy();
      expect(series.label).toBeTruthy();
      expect(series.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(series.framePath).toMatch(/^\/frames\/.+\.png$/);
    }
  });

  it('series IDs are unique', () => {
    const ids = SERIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('card back path is defined', () => {
    expect(CARD_BACK_PATH).toBe('/frames/back.jpg');
  });

  it('font config has Aileron family with 3 variants', () => {
    expect(FONTS.family).toBe('Aileron');
    expect(FONTS.files).toHaveLength(3);
    const weights = FONTS.files.map((f) => `${f.weight}-${f.style}`);
    expect(weights).toContain('400-normal');
    expect(weights).toContain('700-normal');
    expect(weights).toContain('700-italic');
  });

  it('all text zones fit within card bounds', () => {
    for (const [name, zone] of Object.entries(TEXT_ZONES)) {
      expect(zone.x, `${name}.x`).toBeGreaterThanOrEqual(0);
      expect(zone.y, `${name}.y`).toBeGreaterThanOrEqual(0);
      expect(zone.x + zone.maxWidth, `${name} right edge`).toBeLessThanOrEqual(CARD_WIDTH);
      expect(zone.y, `${name} below top`).toBeLessThanOrEqual(CARD_HEIGHT);
    }
  });

  it('text zones are in top-to-bottom order', () => {
    expect(TEXT_ZONES.title.y).toBeLessThan(TEXT_ZONES.tagline.y);
    expect(TEXT_ZONES.tagline.y).toBeLessThan(TEXT_ZONES.funFact.y);
    expect(TEXT_ZONES.funFact.y).toBeLessThan(TEXT_ZONES.proTip.y);
  });

  it('character limits are positive numbers', () => {
    for (const [field, limit] of Object.entries(CHAR_LIMITS)) {
      expect(limit, field).toBeGreaterThan(0);
    }
  });
});
