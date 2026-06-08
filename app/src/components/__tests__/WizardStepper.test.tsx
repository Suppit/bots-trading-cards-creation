// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WizardStepper } from '../WizardStepper';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Helper — mock useAppContext with the given step and optional subStep
function mockContext(step: string, photoCaptureSubStep: 'select' | 'crop' = 'select') {
  vi.mock('@/contexts/AppContext', () => ({
    useAppContext: () => ({
      step,
      photoCaptureSubStep,
    }),
  }));
}

describe('WizardStepper', () => {
  it('renders nothing on the start screen', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'start', photoCaptureSubStep: 'select' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    const { container } = render(<WS />);
    expect(container.innerHTML).toBe('');
    vi.resetModules();
  });

  it('renders three step labels (Photo, Crop, Text)', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'photo-capture', photoCaptureSubStep: 'select' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    render(<WS />);
    expect(screen.getByText('Photo')).toBeDefined();
    expect(screen.getByText('Crop')).toBeDefined();
    expect(screen.getByText('Text')).toBeDefined();
    vi.resetModules();
  });

  it('highlights Photo (step 1) as active during photo-capture/select', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'photo-capture', photoCaptureSubStep: 'select' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    render(<WS />);
    const nav = screen.getByRole('navigation', { name: 'Progress' });
    expect(nav).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    vi.resetModules();
  });

  it('highlights Crop (step 2) as active during photo-capture/crop', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'photo-capture', photoCaptureSubStep: 'crop' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    render(<WS />);
    // Step 1 (Photo) should be completed — shows checkmark, not "1"
    expect(screen.queryByText('1')).toBeNull();
    // Step 2 (Crop) active — shows "2"
    expect(screen.getByText('2')).toBeDefined();
    vi.resetModules();
  });

  it('shows Photo and Crop as fulfilled on text-entry', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'text-entry', photoCaptureSubStep: 'select' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    render(<WS />);
    // Steps 1 and 2 are completed — no numbers shown
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    // Step 3 (Text) is active
    expect(screen.getByText('3')).toBeDefined();
    vi.resetModules();
  });

  it('shows all steps fulfilled on card-reveal', async () => {
    vi.doMock('@/contexts/AppContext', () => ({
      useAppContext: () => ({ step: 'card-reveal', photoCaptureSubStep: 'select' }),
    }));
    const { WizardStepper: WS } = await import('../WizardStepper');
    render(<WS />);
    // All 3 fulfilled — no step numbers visible
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.queryByText('3')).toBeNull();
    vi.resetModules();
  });
});
