// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wrapText } from '../card-renderer';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

/**
 * Creates a mock CanvasRenderingContext2D with a measureText that
 * approximates character widths (each char = charWidth px).
 */
function createMockCtx(charWidth = 10) {
  return {
    font: '',
    fillStyle: '',
    textBaseline: '',
    measureText: vi.fn((text: string) => ({ width: text.length * charWidth })),
    fillText: vi.fn(),
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('card-renderer', () => {
  describe('wrapText', () => {
    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
      ctx = createMockCtx(10); // each char = 10px
    });

    it('returns a single line when text fits within maxWidth', () => {
      const lines = wrapText(ctx, 'Hello world', 200, 44, '700');
      expect(lines).toEqual(['Hello world']);
    });

    it('wraps text at word boundaries when exceeding maxWidth', () => {
      // "Hello world" = 11 chars * 10px = 110px, maxWidth = 80px
      const lines = wrapText(ctx, 'Hello world', 80, 44, '700');
      expect(lines).toEqual(['Hello', 'world']);
    });

    it('wraps long text into multiple lines', () => {
      const text = 'The quick brown fox jumps over the lazy dog';
      // Each word: The(3) quick(5) brown(5) fox(3) jumps(5) over(4) the(3) lazy(4) dog(3)
      // At 10px per char, maxWidth=150px (15 chars)
      const lines = wrapText(ctx, text, 150, 44, '700');
      expect(lines.length).toBeGreaterThan(1);
      // All words should be present
      expect(lines.join(' ')).toBe(text);
    });

    it('handles a single word that fits', () => {
      const lines = wrapText(ctx, 'Hello', 200, 44, '700');
      expect(lines).toEqual(['Hello']);
    });

    it('handles empty text', () => {
      const lines = wrapText(ctx, '', 200, 44, '700');
      expect(lines).toEqual([]);
    });

    it('preserves words across line breaks', () => {
      const text = 'Fun Fact: You can get four in a row';
      const lines = wrapText(ctx, text, 200, 44, '700');
      // Rejoin should equal original
      expect(lines.join(' ')).toBe(text);
    });
  });

  describe('renderCard', () => {
    it('exports renderCard as a function', async () => {
      const { renderCard } = await import('../card-renderer');
      expect(typeof renderCard).toBe('function');
    });
  });
});
