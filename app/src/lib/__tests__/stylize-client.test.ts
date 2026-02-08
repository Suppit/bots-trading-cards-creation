// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// A tiny 1x1 white PNG as base64 for testing
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

/**
 * jsdom doesn't fire Image.onload or support canvas.toBlob,
 * so we mock both to allow the crop pipeline to complete.
 */
function mockImageAndCanvas() {
  // Mock Image so onload fires synchronously when src is set
  vi.stubGlobal(
    'Image',
    class MockImage {
      width = 1536;
      height = 1024;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        // Fire onload on next microtask
        queueMicrotask(() => this.onload?.());
      }
    },
  );

  // Mock HTMLCanvasElement.prototype methods
  const mockCtx = {
    drawImage: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    mockCtx as unknown as CanvasRenderingContext2D,
  );
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
  ) {
    cb(new Blob(['cropped'], { type: 'image/jpeg' }));
  });
}

describe('stylize-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(0) });
  });

  it('sends photo to /api/stylize and returns a Blob', async () => {
    mockImageAndCanvas();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ imageBase64: TINY_PNG_BASE64 }),
      }),
    );

    const { stylizePhoto } = await import('../stylize-client');
    const inputBlob = new Blob(['test-photo'], { type: 'image/jpeg' });

    const result = await stylizePhoto(inputBlob);

    expect(result).toBeInstanceOf(Blob);
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);

    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe('/api/stylize');
    expect(options?.method).toBe('POST');
    expect(options?.body).toBeInstanceOf(FormData);
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal Server Error' }),
      }),
    );

    const { stylizePhoto } = await import('../stylize-client');
    const inputBlob = new Blob(['test'], { type: 'image/jpeg' });

    await expect(stylizePhoto(inputBlob)).rejects.toThrow('Internal Server Error');
  });

  it('throws when response has no imageBase64', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

    const { stylizePhoto } = await import('../stylize-client');
    const inputBlob = new Blob(['test'], { type: 'image/jpeg' });

    await expect(stylizePhoto(inputBlob)).rejects.toThrow('No image data');
  });
});
