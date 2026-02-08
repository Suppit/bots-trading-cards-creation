// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { PhotoCropper } from '../PhotoCapture/PhotoCropper';

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('@/lib/layout-constants', () => ({
  PORTRAIT_ASPECT_RATIO: 114 / 97,
}));

vi.mock('@/hooks/useImageCrop', () => ({
  useImageCrop: () => ({
    extractCrop: vi.fn().mockResolvedValue({
      blob: new Blob(['test'], { type: 'image/jpeg' }),
      width: 1305,
      height: 1111,
    }),
  }),
}));

// Mock react-image-crop to avoid DOM measurement issues in jsdom
vi.mock('react-image-crop', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-crop">{children}</div>
  ),
}));

vi.mock('react-image-crop/dist/ReactCrop.css', () => ({}));

// Mock URL.createObjectURL
const mockObjectURL = 'blob:mock-url';
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: vi.fn().mockReturnValue(mockObjectURL),
  revokeObjectURL: vi.fn(),
});

function createMockFile(): File {
  const blob = new Blob(['test-image-data'], { type: 'image/jpeg' });
  Object.defineProperty(blob, 'name', { value: 'test.jpg' });
  Object.defineProperty(blob, 'size', { value: 2048 });
  return blob as File;
}

describe('PhotoCropper', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the crop heading', () => {
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={vi.fn()} />,
    );
    expect(screen.getByText('Crop Your Photo')).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={vi.fn()} />,
    );
    expect(screen.getByText('Adjust the crop area for your card portrait')).toBeDefined();
  });

  it('renders "Use This Photo" button with 48px+ touch target', () => {
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'Use This Photo' });
    expect(button).toBeDefined();
    expect(button.className).toContain('min-h-[48px]');
  });

  it('renders "Choose Different Photo" button', () => {
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={vi.fn()} />,
    );
    const button = screen.getByRole('button', { name: 'Choose Different Photo' });
    expect(button).toBeDefined();
  });

  it('calls onBack when "Choose Different Photo" is clicked', () => {
    const onBack = vi.fn();
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={onBack} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Choose Different Photo' }));
    expect(onBack).toHaveBeenCalled();
  });

  it('creates an object URL from the file', () => {
    render(
      <PhotoCropper file={createMockFile()} onCropComplete={vi.fn()} onBack={vi.fn()} />,
    );
    expect(URL.createObjectURL).toHaveBeenCalled();
  });
});
