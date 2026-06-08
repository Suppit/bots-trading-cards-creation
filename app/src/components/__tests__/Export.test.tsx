// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { Export } from '../Export';

const mockSetStep = vi.fn();
const mockSetCardDataUrl = vi.fn();
const MOCK_DATA_URL = 'data:image/png;base64,mockdata';

function makeMockContext(overrides: Record<string, unknown> = {}) {
  return {
    step: 'export',
    setStep: mockSetStep,
    cardDataUrl: MOCK_DATA_URL,
    setCardDataUrl: mockSetCardDataUrl,
    preloadResult: null,
    preloadProgress: null,
    preloadError: null,
    isPreloadComplete: true,
    retryPreload: vi.fn(),
    croppedPhoto: null,
    setCroppedPhoto: vi.fn(),
    formData: null,
    setFormData: vi.fn(),
    stylizedPhoto: null,
    setStylizedPhoto: vi.fn(),
    stylizationStatus: 'idle' as const,
    setStylizationStatus: vi.fn(),
    stylizationError: null,
    setStylizationError: vi.fn(),
    photoCaptureSubStep: 'select' as const,
    setPhotoCaptureSubStep: vi.fn(),
    resetSession: vi.fn(),
    ...overrides,
  };
}

let mockContextValue = makeMockContext();

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

describe('Export', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    mockContextValue = makeMockContext();
  });

  it('renders the heading', () => {
    render(<Export />);
    expect(screen.getByText('Check it out!')).toBeDefined();
  });

  it('displays the card image when cardDataUrl is set', () => {
    render(<Export />);
    const img = screen.getByTestId('export-card-image') as HTMLImageElement;
    expect(img.src).toContain('data:image/png');
  });

  it('shows "Card not available" when cardDataUrl is null', () => {
    mockContextValue = makeMockContext({ cardDataUrl: null });
    render(<Export />);
    expect(screen.getByText('Card not available')).toBeDefined();
  });

  it('renders the Download Card button', () => {
    render(<Export />);
    expect(screen.getByTestId('download-button')).toBeDefined();
  });

  it('download button is disabled when cardDataUrl is null', () => {
    mockContextValue = makeMockContext({ cardDataUrl: null });
    render(<Export />);
    expect(screen.getByTestId('download-button').hasAttribute('disabled')).toBe(true);
  });

  it('download button triggers a link click', () => {
    render(<Export />);

    const linkClickSpy = vi.fn();
    const mockLink = { href: '', download: '', click: linkClickSpy } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink);

    fireEvent.click(screen.getByTestId('download-button'));
    expect(linkClickSpy).toHaveBeenCalled();
    expect(mockLink.download).toMatch(/^bots-card-\d+\.png$/);
  });

  it('back button navigates to card-reveal', () => {
    render(<Export />);
    fireEvent.click(screen.getByRole('button', { name: 'Go to previous step' }));
    expect(mockSetStep).toHaveBeenCalledWith('card-reveal');
  });

  it('always renders the save/download button', () => {
    render(<Export />);
    expect(screen.getByTestId('download-button')).toBeDefined();
  });
});
