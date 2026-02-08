import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track FontFace constructor calls
const fontFaceCalls: unknown[][] = [];
const mockFontsAdd = vi.fn();

vi.stubGlobal('FontFace', class MockFontFace {
  constructor(...args: unknown[]) {
    fontFaceCalls.push(args);
  }
  load() {
    return Promise.resolve(this);
  }
});

vi.stubGlobal('document', {
  fonts: {
    add: mockFontsAdd,
    ready: Promise.resolve(),
  },
});

vi.stubGlobal('Image', class MockImage {
  src = '';
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;

  constructor() {
    const self = this;
    Object.defineProperty(this, 'src', {
      set(value: string) {
        self._src = value;
        setTimeout(() => self.onload?.(), 0);
      },
      get() {
        return self._src || '';
      },
    });
  }

  private _src = '';
});

vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });

describe('preloader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fontFaceCalls.length = 0;
    let callCount = 0;
    vi.mocked(performance.now).mockImplementation(() => callCount++ * 100);
  });

  it('exports a preloadAssets function', async () => {
    const { preloadAssets } = await import('../preloader');
    expect(typeof preloadAssets).toBe('function');
  });

  it('calls progress callback for each asset', async () => {
    const { preloadAssets } = await import('../preloader');
    const onProgress = vi.fn();

    await preloadAssets(onProgress);

    // 5 frames + 1 fonts = 6 assets
    expect(onProgress).toHaveBeenCalledTimes(6);
  });

  it('progress reaches 100%', async () => {
    const { preloadAssets } = await import('../preloader');
    const onProgress = vi.fn();

    await preloadAssets(onProgress);

    const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
    expect(lastCall.percent).toBe(1);
    expect(lastCall.loaded).toBe(lastCall.total);
  });

  it('returns preload result with expected shape', async () => {
    const { preloadAssets } = await import('../preloader');

    const result = await preloadAssets();

    expect(result).toHaveProperty('frames');
    expect(result).toHaveProperty('fontsReady');
    expect(result).toHaveProperty('totalTimeMs');
    expect(result.frames).toBeInstanceOf(Map);
    expect(typeof result.fontsReady).toBe('boolean');
    expect(typeof result.totalTimeMs).toBe('number');
  });

  it('loads FontFace for each font variant', async () => {
    const { preloadAssets } = await import('../preloader');
    fontFaceCalls.length = 0;

    await preloadAssets();

    // 3 font variants: Regular (400), Bold (700), BoldItalic (700 italic)
    expect(fontFaceCalls.length).toBe(3);
    expect(fontFaceCalls[0][0]).toBe('Aileron');
    expect(fontFaceCalls[1][0]).toBe('Aileron');
    expect(fontFaceCalls[2][0]).toBe('Aileron');
  });
});
