// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor, fireEvent } from '@testing-library/react';
import { CardReveal } from '../CardReveal';

const mockSetStep = vi.fn();
const mockSetCardDataUrl = vi.fn();
const mockResetSession = vi.fn();

const mockFormData = {
  title: 'Test Title',
  tagline: 'Test Tagline',
  funFact: 'Test Fun Fact',
  proTip: 'Test Pro Tip',
  proTipLabel: 'Pro Tip',
};

const mockFrame = {} as HTMLImageElement;

vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    step: 'card-reveal',
    setStep: mockSetStep,
    croppedPhoto: {
      blob: new Blob(['photo'], { type: 'image/jpeg' }),
      width: 1231,
      height: 1043,
      originalWidth: 1231,
      originalHeight: 1043,
      originalSizeKB: 10,
    },
    stylizedPhoto: null,
    formData: mockFormData,
    preloadResult: {
      frames: new Map([['specialty', mockFrame]]),
    },
    cardDataUrl: null,
    setCardDataUrl: mockSetCardDataUrl,
    photoCaptureSubStep: 'select' as const,
    setPhotoCaptureSubStep: vi.fn(),
    resetSession: mockResetSession,
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

vi.mock('@/lib/card-renderer', () => ({
  renderCard: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,mockdata',
  }),
}));

// lottie-web probes for canvas 2D context support at import time, which jsdom
// doesn't provide — stub it out so the confetti overlay doesn't crash tests.
vi.mock('lottie-react', () => ({
  default: () => null,
}));

async function renderAndWait() {
  render(<CardReveal />);
  await waitFor(() => expect(screen.getByTestId('card-image')).toBeDefined(), {
    timeout: 3000,
  });
}

describe('CardReveal', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['card'], { type: 'image/png' })),
    }));
  });

  it('shows loading state initially', () => {
    render(<CardReveal />);
    expect(screen.getByText('Generating your card…')).toBeDefined();
  });

  it('renders the card image after successful render', async () => {
    await renderAndWait();
    expect(screen.getByTestId('card-image')).toBeDefined();
  });

  it('renders the "Check it out!" heading', async () => {
    await renderAndWait();
    expect(screen.getByText('Check it out!')).toBeDefined();
  });

  it('renders the create-another, add-to-home, and share buttons', async () => {
    await renderAndWait();
    expect(screen.getByTestId('create-another-button')).toBeDefined();
    expect(screen.getByTestId('add-to-home-button')).toBeDefined();
    expect(screen.getByTestId('share-button')).toBeDefined();
  });

  it('navigates back to text-entry when Back is clicked', async () => {
    await renderAndWait();
    await act(async () => {
      screen.getByRole('button', { name: 'Go to previous step' }).click();
    });
    expect(mockSetStep).toHaveBeenCalledWith('text-entry');
  });

  it('resets the session when Create another is clicked', async () => {
    await renderAndWait();
    fireEvent.click(screen.getByTestId('create-another-button'));
    expect(mockResetSession).toHaveBeenCalled();
  });

  it('resets the session when Home is clicked', async () => {
    await renderAndWait();
    fireEvent.click(screen.getByRole('button', { name: 'Go to home' }));
    expect(mockResetSession).toHaveBeenCalled();
  });
});
