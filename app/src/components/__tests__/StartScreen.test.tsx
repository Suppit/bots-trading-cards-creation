// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { StartScreen } from '../StartScreen';

// Mock the AppContext
const mockSetStep = vi.fn();
const mockRetryPreload = vi.fn();
const mockSetCroppedPhoto = vi.fn();
const mockSetFormData = vi.fn();

let mockContextValue = {
  step: 'start' as const,
  setStep: mockSetStep,
  preloadResult: null,
  preloadProgress: null,
  preloadError: null,
  isPreloadComplete: false,
  retryPreload: mockRetryPreload,
  croppedPhoto: null,
  setCroppedPhoto: mockSetCroppedPhoto,
  formData: null,
  setFormData: mockSetFormData,
  stylizedPhoto: null,
  setStylizedPhoto: vi.fn(),
  stylizationStatus: 'idle' as const,
  setStylizationStatus: vi.fn(),
  stylizationError: null,
  setStylizationError: vi.fn(),
};

vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => mockContextValue,
}));

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('StartScreen', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockContextValue = {
      step: 'start',
      setStep: mockSetStep,
      preloadResult: null,
      preloadProgress: null,
      preloadError: null,
      isPreloadComplete: false,
      retryPreload: mockRetryPreload,
      croppedPhoto: null,
      setCroppedPhoto: mockSetCroppedPhoto,
      formData: null,
      setFormData: mockSetFormData,
      stylizedPhoto: null,
      setStylizedPhoto: vi.fn(),
      stylizationStatus: 'idle' as const,
      setStylizationStatus: vi.fn(),
      stylizationError: null,
      setStylizationError: vi.fn(),
    };
  });

  it('renders the BOTS logo', () => {
    render(<StartScreen />);
    const logo = screen.getByLabelText('BOTS logo');
    expect(logo).toBeDefined();
  });

  it('renders the tagline text', () => {
    render(<StartScreen />);
    expect(screen.getByText('Create Your Trading Card')).toBeDefined();
  });

  it('renders Start button with proper touch target', () => {
    render(<StartScreen />);
    const button = screen.getByRole('button', { name: 'Start' });
    expect(button).toBeDefined();
    // Verify minimum touch target classes are applied
    expect(button.className).toContain('min-h-[48px]');
  });

  it('shows progress bar when preloading', () => {
    mockContextValue.preloadProgress = {
      loaded: 3,
      total: 7,
      percent: 3 / 7,
      currentAsset: 'series-3',
    };
    render(<StartScreen />);
    expect(screen.getByText('Loading assets…')).toBeDefined();
  });

  it('hides progress bar when preload is complete', () => {
    mockContextValue.isPreloadComplete = true;
    render(<StartScreen />);
    expect(screen.queryByText('Loading assets…')).toBeNull();
  });

  it('navigates to photo-capture when Start is tapped and preload is complete', () => {
    mockContextValue.isPreloadComplete = true;
    render(<StartScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(mockSetStep).toHaveBeenCalledWith('photo-capture');
  });

  it('shows Loading state when Start is tapped before preload finishes', () => {
    render(<StartScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByText('Loading…')).toBeDefined();
    expect(mockSetStep).not.toHaveBeenCalled();
  });

  it('shows Retry button on preload error', () => {
    mockContextValue.preloadError = 'Network error';
    render(<StartScreen />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeDefined();
    expect(screen.getByText(/Failed to load assets/)).toBeDefined();
  });

  it('calls retryPreload when Retry is tapped', () => {
    mockContextValue.preloadError = 'Network error';
    render(<StartScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(mockRetryPreload).toHaveBeenCalled();
  });
});
