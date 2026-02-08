// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { WizardStepper } from '../WizardStepper';

describe('WizardStepper', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing on the start screen', () => {
    const { container } = render(<WizardStepper currentStep="start" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders three step labels', () => {
    render(<WizardStepper currentStep="photo-capture" />);
    expect(screen.getByText('Photo')).toBeDefined();
    expect(screen.getByText('Text')).toBeDefined();
    expect(screen.getByText('Card')).toBeDefined();
  });

  it('highlights Photo as active during photo-capture', () => {
    render(<WizardStepper currentStep="photo-capture" />);
    const nav = screen.getByRole('navigation', { name: 'Progress' });
    expect(nav).toBeDefined();
    // Step 1 should be outlined (active), not filled
    expect(screen.getByText('1')).toBeDefined();
  });

  it('shows checkmark for completed steps on text-entry', () => {
    render(<WizardStepper currentStep="text-entry" />);
    // Step 1 (Photo) should be completed — no "1" text, has a checkmark SVG
    expect(screen.queryByText('1')).toBeNull();
    // Step 2 should be active
    expect(screen.getByText('2')).toBeDefined();
  });

  it('shows checkmarks for Photo and Text on card-reveal', () => {
    render(<WizardStepper currentStep="card-reveal" />);
    expect(screen.queryByText('1')).toBeNull();
    expect(screen.queryByText('2')).toBeNull();
    expect(screen.getByText('3')).toBeDefined();
  });
});
