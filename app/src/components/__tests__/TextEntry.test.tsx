// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { TextEntry } from '../TextEntry';

const mockSetStep = vi.fn();
const mockSetFormData = vi.fn();

vi.mock('@/contexts/AppContext', () => ({
  useAppContext: () => ({
    step: 'text-entry',
    setStep: mockSetStep,
    setFormData: mockSetFormData,
    formData: null,
    preloadResult: null,
    preloadProgress: null,
    preloadError: null,
    isPreloadComplete: true,
    retryPreload: vi.fn(),
    croppedPhoto: null,
    setCroppedPhoto: vi.fn(),
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

let mockProfanityResult = false;
vi.mock('@/utils/profanity-filter', () => ({
  containsProfanity: (text: string) => {
    // Allow test-controlled override, but also detect a known bad word for realism
    if (mockProfanityResult) return true;
    return text.toLowerCase().includes('badword');
  },
}));

describe('TextEntry', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfanityResult = false;
  });

  it('renders all 4 fields with labels', () => {
    render(<TextEntry />);
    expect(screen.getByLabelText('Title *')).toBeDefined();
    expect(screen.getByLabelText('Tagline *')).toBeDefined();
    expect(screen.getByLabelText('Fun Fact *')).toBeDefined();
    expect(screen.getByLabelText('Pro Tip *')).toBeDefined();
  });

  it('renders the heading', () => {
    render(<TextEntry />);
    expect(screen.getByText('Add Your Details')).toBeDefined();
  });

  it('shows character counters with initial values', () => {
    render(<TextEntry />);
    expect(screen.getByTestId('counter-title').textContent).toBe('0/30');
    expect(screen.getByTestId('counter-tagline').textContent).toBe('0/60');
    expect(screen.getByTestId('counter-funFact').textContent).toBe('0/120');
    expect(screen.getByTestId('counter-proTip').textContent).toBe('0/120');
  });

  it('updates character counters as user types', () => {
    render(<TextEntry />);
    const titleInput = screen.getByTestId('field-title');
    fireEvent.change(titleInput, { target: { value: 'Hello' } });
    expect(screen.getByTestId('counter-title').textContent).toBe('5/30');
  });

  it('clamps input to max length', () => {
    render(<TextEntry />);
    const titleInput = screen.getByTestId('field-title') as HTMLInputElement;
    const longText = 'A'.repeat(50);
    fireEvent.change(titleInput, { target: { value: longText } });
    expect(titleInput.value).toBe('A'.repeat(30));
    expect(screen.getByTestId('counter-title').textContent).toBe('30/30');
  });

  it('submit button is disabled when fields are empty', () => {
    render(<TextEntry />);
    const button = screen.getByTestId('submit-button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('submit button enables when all fields have content', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'Title' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: 'Tagline' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: 'Fun fact' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: 'Pro tip' },
    });

    const button = screen.getByTestId('submit-button');
    expect(button.hasAttribute('disabled')).toBe(false);
  });

  it('calls setFormData and setStep on valid submission', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'My Title' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: 'My Tagline' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: 'My Fun Fact' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: 'My Pro Tip' },
    });

    fireEvent.submit(screen.getByTestId('text-entry-form'));

    expect(mockSetFormData).toHaveBeenCalledWith({
      title: 'My Title',
      tagline: 'My Tagline',
      funFact: 'My Fun Fact',
      proTip: 'My Pro Tip',
    });
    expect(mockSetStep).toHaveBeenCalledWith('card-reveal');
  });

  it('trims whitespace from values on submission', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: '  Spaced  ' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: ' Tag ' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: ' Fact ' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: ' Tip ' },
    });

    fireEvent.submit(screen.getByTestId('text-entry-form'));

    expect(mockSetFormData).toHaveBeenCalledWith({
      title: 'Spaced',
      tagline: 'Tag',
      funFact: 'Fact',
      proTip: 'Tip',
    });
  });

  it('does not submit when fields are whitespace-only', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: '   ' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: '   ' },
    });

    // Button should be disabled since trimmed content is empty
    const button = screen.getByTestId('submit-button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('counter changes color when near limit', () => {
    render(<TextEntry />);
    const titleInput = screen.getByTestId('field-title');
    const counter = screen.getByTestId('counter-title');

    // Under 80% — default color
    fireEvent.change(titleInput, { target: { value: 'A'.repeat(20) } });
    expect(counter.className).toContain('text-foreground/40');

    // Over 80% — amber warning
    fireEvent.change(titleInput, { target: { value: 'A'.repeat(25) } });
    expect(counter.className).toContain('text-amber-500');

    // At 100% — red
    fireEvent.change(titleInput, { target: { value: 'A'.repeat(30) } });
    expect(counter.className).toContain('text-red-500');
  });

  it('renders title and tagline as input elements', () => {
    render(<TextEntry />);
    const title = screen.getByTestId('field-title');
    const tagline = screen.getByTestId('field-tagline');
    expect(title.tagName).toBe('INPUT');
    expect(tagline.tagName).toBe('INPUT');
  });

  it('renders funFact and proTip as textarea elements', () => {
    render(<TextEntry />);
    const funFact = screen.getByTestId('field-funFact');
    const proTip = screen.getByTestId('field-proTip');
    expect(funFact.tagName).toBe('TEXTAREA');
    expect(proTip.tagName).toBe('TEXTAREA');
  });

  // Profanity filter tests
  it('shows profanity error when inappropriate word is entered', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'badword' },
    });

    expect(screen.getByTestId('profanity-title')).toBeDefined();
    expect(screen.getByTestId('profanity-title').textContent).toBe(
      'Please remove inappropriate language',
    );
  });

  it('disables submit button when profanity is present', () => {
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'badword' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: 'Tagline' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: 'Fun fact' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: 'Pro tip' },
    });

    const button = screen.getByTestId('submit-button');
    expect(button.hasAttribute('disabled')).toBe(true);
  });

  it('clears profanity error when text is corrected', () => {
    render(<TextEntry />);
    const titleInput = screen.getByTestId('field-title');

    // Enter bad word
    fireEvent.change(titleInput, { target: { value: 'badword' } });
    expect(screen.getByTestId('profanity-title')).toBeDefined();

    // Fix it
    fireEvent.change(titleInput, { target: { value: 'Good title' } });
    expect(screen.queryByTestId('profanity-title')).toBeNull();
  });

  it('does not submit form when profanity is present even via form submit', () => {
    mockProfanityResult = true;
    render(<TextEntry />);
    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'test' },
    });
    fireEvent.change(screen.getByTestId('field-tagline'), {
      target: { value: 'test' },
    });
    fireEvent.change(screen.getByTestId('field-funFact'), {
      target: { value: 'test' },
    });
    fireEvent.change(screen.getByTestId('field-proTip'), {
      target: { value: 'test' },
    });

    fireEvent.submit(screen.getByTestId('text-entry-form'));

    expect(mockSetFormData).not.toHaveBeenCalled();
    expect(mockSetStep).not.toHaveBeenCalled();
  });
});
