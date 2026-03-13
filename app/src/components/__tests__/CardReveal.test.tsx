// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act, waitFor } from '@testing-library/react';
import { CardReveal } from '../CardReveal';

const mockSetStep = vi.fn();

const mockFormData = {
  title: 'Test Title',
  tagline: 'Test Tagline',
  funFact: 'Test Fun Fact',
  proTip: 'Test Pro Tip',
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
      frames: new Map([
        ['specialty', mockFrame],
        ['series-1', mockFrame],
        ['series-2', mockFrame],
        ['series-3', mockFrame],
        ['series-4', mockFrame],
      ]),
    },
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
  });

  it('shows loading state initially', () => {
    render(<CardReveal />);
    expect(screen.getByText('Generating your card...')).toBeDefined();
  });

  it('renders the card image after successful render', async () => {
    await renderAndWait();
    expect(screen.getByTestId('card-image')).toBeDefined();
  });

  it('defaults to Specialty series label', async () => {
    await renderAndWait();
    expect(screen.getByTestId('series-label').textContent).toBe('Specialty');
  });

  it('shows 5 series dots', async () => {
    await renderAndWait();
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`series-dot-${i}`)).toBeDefined();
    }
  });

  it('navigates to next series when next button is clicked', async () => {
    await renderAndWait();
    await act(async () => {
      screen.getByTestId('series-next').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('series-label').textContent).toBe('Series 1'),
    );
  });

  it('wraps from Series 4 back to Specialty on next', async () => {
    await renderAndWait();
    // Navigate to Series 4 (index 4) by clicking next 4 times
    for (let i = 0; i < 4; i++) {
      await act(async () => {
        screen.getByTestId('series-next').click();
      });
    }
    await waitFor(() =>
      expect(screen.getByTestId('series-label').textContent).toBe('Series 4'),
    );
    // One more wraps back to Specialty
    await act(async () => {
      screen.getByTestId('series-next').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('series-label').textContent).toBe('Specialty'),
    );
  });

  it('wraps from Specialty to Series 4 on prev', async () => {
    await renderAndWait();
    await act(async () => {
      screen.getByTestId('series-prev').click();
    });
    await waitFor(() =>
      expect(screen.getByTestId('series-label').textContent).toBe('Series 4'),
    );
  });

  it('navigates back to text-entry when Back is clicked', async () => {
    await renderAndWait();
    await act(async () => {
      screen.getByTestId('back-button').click();
    });
    expect(mockSetStep).toHaveBeenCalledWith('text-entry');
  });

  it('navigates to export when Save Card is clicked', async () => {
    await renderAndWait();
    await act(async () => {
      screen.getByTestId('save-button').click();
    });
    expect(mockSetStep).toHaveBeenCalledWith('export');
  });
});
