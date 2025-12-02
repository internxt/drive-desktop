import { render, screen } from '@testing-library/react';
import { ScanStatistics } from './ScanStatistics';
import * as LocalContext from '../../../../context/LocalContext';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {
    // Mock implementation
    return null;
  }
  unobserve() {
    // Mock implementation
    return null;
  }
  disconnect() {
    // Mock implementation
    return null;
  }
}

// Add the mock to the global object
global.ResizeObserver = ResizeObserverMock;

describe('ScanStatistics', () => {
  const mockTranslate = vi.fn((key) => key);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(LocalContext, 'useTranslationContext').mockReturnValue({
      translate: mockTranslate,
      language: 'en',
    });
  });

  it('renders the component with correct content', () => {
    render(<ScanStatistics scannedFilesCount={100} corruptedFilesCount={5} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.scannedFiles');
    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.detectedFiles');

    expect(screen.getByText('settings.antivirus.scanProcess.scannedFiles')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.detectedFiles')).toBeInTheDocument();
  });

  it('updates the displayed counts when props change', () => {
    const { rerender } = render(<ScanStatistics scannedFilesCount={100} corruptedFilesCount={5} />);

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    rerender(<ScanStatistics scannedFilesCount={200} corruptedFilesCount={10} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('applies the correct styling', () => {
    render(<ScanStatistics scannedFilesCount={100} corruptedFilesCount={5} />);

    const container = screen.getByText('100').closest('div.flex.h-full');
    expect(container).toHaveClass('flex h-full w-full items-stretch gap-5 rounded-xl bg-surface py-4');

    const innerContainer = screen.getByText('100').closest('div.flex.w-full.flex-row');
    expect(innerContainer).toHaveClass('flex w-full flex-row justify-center gap-5');

    const scannedContainer = screen.getByText('100').closest('div.flex.w-full.max-w-\\[124px\\]');
    expect(scannedContainer).toHaveClass(
      'flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center',
    );

    const rowContainer = screen.getByText('100').closest('div.flex.w-full.flex-row');
    const divider = rowContainer && rowContainer.querySelector('div.flex.flex-col.border');
    expect(divider).not.toBeNull();
    expect(divider).toHaveClass('flex flex-col border border-gray-10');

    const corruptedContainer = screen.getByText('5').closest('div.flex.w-full.max-w-\\[124px\\]');
    expect(corruptedContainer).toHaveClass(
      'flex w-full max-w-[124px] flex-col items-center justify-center gap-1 text-center',
    );
  });
});
