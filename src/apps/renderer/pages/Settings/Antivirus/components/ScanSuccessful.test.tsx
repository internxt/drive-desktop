import { render, screen } from '@testing-library/react';
import { ScanSuccessful } from './ScanSuccessful';

describe('ScanSuccessful', () => {
  const mockTranslate = vi.fn((key) => key);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with correct content', () => {
    render(<ScanSuccessful translate={mockTranslate} />);

    expect(screen.getByText('settings.antivirus.scanProcess.noFilesFound.title')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.noFilesFound.subtitle')).toBeInTheDocument();

    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.noFilesFound.title');
    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.noFilesFound.subtitle');
  });

  it('renders the shield check icon', () => {
    render(<ScanSuccessful translate={mockTranslate} />);

    const iconElement = screen.getByTestId('shield-check-icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveClass('text-green');
  });

  it('applies the correct styling', () => {
    render(<ScanSuccessful translate={mockTranslate} />);

    const container = screen.getByTestId('scan-successful-container');
    expect(container).toHaveClass('flex flex-col items-center gap-4');

    const textContainer = screen.getByText('settings.antivirus.scanProcess.noFilesFound.title').closest('div');
    expect(textContainer).toHaveClass('flex flex-col gap-1 text-center');

    const title = screen.getByText('settings.antivirus.scanProcess.noFilesFound.title');
    expect(title).toHaveClass('font-medium text-gray-100');

    const subtitle = screen.getByText('settings.antivirus.scanProcess.noFilesFound.subtitle');
    expect(subtitle).toHaveClass('text-sm text-gray-80');
  });
});
