// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { PhotoSelector } from '../PhotoCapture/PhotoSelector';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/utils/image-validation', () => ({
  validateFileType: vi.fn().mockReturnValue({ valid: true }),
  validateFileSize: vi.fn().mockReturnValue({ valid: true }),
  validateDimensions: vi.fn().mockReturnValue({ valid: true }),
  getImageDimensions: vi.fn().mockResolvedValue({ width: 1000, height: 800 }),
}));

// Mock getUserMedia
const mockGetUserMedia = vi.fn();
const mockStop = vi.fn();

beforeEach(() => {
  mockGetUserMedia.mockResolvedValue({
    getTracks: () => [{ stop: mockStop }],
  });

  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: mockGetUserMedia,
    },
  });
});

describe('PhotoSelector', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the "Take a selfie" heading', async () => {
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    expect(screen.getByText('Take a selfie')).toBeDefined();
  });

  it('shows requesting state initially before camera resolves', () => {
    // Make getUserMedia hang (never resolve)
    mockGetUserMedia.mockReturnValue(new Promise(() => {}));
    render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    expect(screen.getByText('Requesting camera access...')).toBeDefined();
  });

  it('shows camera preview when permission is granted', async () => {
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    expect(screen.getByTestId('camera-preview')).toBeDefined();
  });

  it('shows capture button when camera is active', async () => {
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    const captureBtn = screen.getByRole('button', { name: 'Capture photo' });
    expect(captureBtn).toBeDefined();
  });

  it('shows "Or choose from library" link when camera is active', async () => {
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    expect(screen.getByText('Or choose from library')).toBeDefined();
  });

  it('shows denied state when permission is refused', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('NotAllowedError'));
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    expect(screen.getByText(/Camera access was denied/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Upload a Photo' })).toBeDefined();
  });

  it('shows unavailable state when camera is not found', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('NotFoundError'));
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    expect(screen.getByText(/Camera is not available/)).toBeDefined();
  });

  it('has a hidden gallery file input', async () => {
    await act(async () => {
      render(<PhotoSelector onPhotoSelected={vi.fn()} />);
    });
    const input = screen.getByTestId('gallery-input') as HTMLInputElement;
    expect(input.type).toBe('file');
    expect(input.accept).toBe('image/*');
  });
});
