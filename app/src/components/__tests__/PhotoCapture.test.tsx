// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { PhotoCapture } from '../PhotoCapture';

const mockSetStep = vi.fn();
const mockSetCroppedPhoto = vi.fn();

vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    step: 'photo-capture',
    setStep: mockSetStep,
    setCroppedPhoto: mockSetCroppedPhoto,
    croppedPhoto: null,
    preloadResult: null,
    preloadProgress: null,
    preloadError: null,
    isPreloadComplete: true,
    retryPreload: vi.fn(),
    formData: null,
    setFormData: vi.fn(),
    stylizedPhoto: null,
    setStylizedPhoto: vi.fn(),
    stylizationStatus: 'idle' as const,
    setStylizationStatus: vi.fn(),
    stylizationError: null,
    setStylizationError: vi.fn(),
  }),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/stylize-client', () => ({
  stylizePhoto: vi.fn().mockResolvedValue(new Blob(['styled'], { type: 'image/jpeg' })),
}));

// Mock child components to test orchestration
vi.mock('../PhotoCapture/PhotoSelector', () => ({
  PhotoSelector: ({ onPhotoSelected }: { onPhotoSelected: (f: File) => void }) => (
    <div data-testid="photo-selector">
      <button
        onClick={() => {
          const blob = new Blob(['test'], { type: 'image/jpeg' });
          Object.defineProperty(blob, 'name', { value: 'test.jpg' });
          Object.defineProperty(blob, 'size', { value: 1024 });
          onPhotoSelected(blob as File);
        }}
      >
        Mock Select
      </button>
    </div>
  ),
}));

vi.mock('../PhotoCapture/PhotoCropper', () => ({
  PhotoCropper: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="photo-cropper">
      <button onClick={onBack}>Mock Back</button>
    </div>
  ),
}));

describe('PhotoCapture', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in the select sub-step', () => {
    render(<PhotoCapture />);
    expect(screen.getByTestId('photo-selector')).toBeDefined();
    expect(screen.queryByTestId('photo-cropper')).toBeNull();
  });

  it('transitions to crop sub-step when a photo is selected', async () => {
    render(<PhotoCapture />);
    await act(() => {
      screen.getByRole('button', { name: 'Mock Select' }).click();
    });

    expect(screen.getByTestId('photo-cropper')).toBeDefined();
    expect(screen.queryByTestId('photo-selector')).toBeNull();
  });

  it('transitions back to select when back is clicked from crop', async () => {
    render(<PhotoCapture />);

    // Go to crop
    await act(() => {
      screen.getByRole('button', { name: 'Mock Select' }).click();
    });
    expect(screen.getByTestId('photo-cropper')).toBeDefined();

    // Go back
    await act(() => {
      screen.getByRole('button', { name: 'Mock Back' }).click();
    });
    expect(screen.getByTestId('photo-selector')).toBeDefined();
    expect(screen.queryByTestId('photo-cropper')).toBeNull();
  });
});
