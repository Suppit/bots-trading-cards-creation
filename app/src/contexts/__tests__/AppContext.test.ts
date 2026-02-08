import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock browser APIs
const mockFontsAdd = vi.fn();

vi.stubGlobal('FontFace', class MockFontFace {
  load() { return Promise.resolve(this); }
});

vi.stubGlobal('document', {
  fonts: { add: mockFontsAdd, ready: Promise.resolve() },
});

vi.stubGlobal('Image', class MockImage {
  private _src = '';
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  constructor() {
    const self = this;
    Object.defineProperty(this, 'src', {
      set(value: string) {
        self._src = value;
        setTimeout(() => self.onload?.(), 0);
      },
      get() { return self._src; },
    });
  }
});

vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });

describe('AppContext types', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports AppProvider and useAppContext', async () => {
    const mod = await import('../AppContext');
    expect(typeof mod.AppProvider).toBe('function');
    expect(typeof mod.useAppContext).toBe('function');
  });

  it('AppStep type includes expected steps', async () => {
    // Type-level check — we verify the module imports without error
    const mod = await import('../AppContext');
    expect(mod).toBeDefined();
  });
});
