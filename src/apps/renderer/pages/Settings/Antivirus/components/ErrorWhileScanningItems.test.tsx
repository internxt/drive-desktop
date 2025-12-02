import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorWhileScanningItems } from './ErrorWhileScanningItems';

describe('ErrorWhileScanningItems', () => {
  const mockTranslate = vi.fn((key) => key);
  const mockOnScanAgainButtonClicked = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with correct content', () => {
    render(
      <ErrorWhileScanningItems translate={mockTranslate} onScanAgainButtonClicked={mockOnScanAgainButtonClicked} />,
    );

    expect(screen.getByText('settings.antivirus.errorState.title')).toBeInTheDocument();

    expect(screen.getByText('settings.antivirus.errorState.button')).toBeInTheDocument();

    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.errorState.title');
    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.errorState.button');
  });

  it('calls onScanAgainButtonClicked when button is clicked', () => {
    render(
      <ErrorWhileScanningItems translate={mockTranslate} onScanAgainButtonClicked={mockOnScanAgainButtonClicked} />,
    );

    const button = screen.getByText('settings.antivirus.errorState.button');
    fireEvent.click(button);

    expect(mockOnScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('renders the shield warning icon', () => {
    render(
      <ErrorWhileScanningItems translate={mockTranslate} onScanAgainButtonClicked={mockOnScanAgainButtonClicked} />,
    );

    const iconElement = screen.getByTestId('shield-warning-icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveClass('text-red');
  });

  it('applies the correct styling', () => {
    render(
      <ErrorWhileScanningItems translate={mockTranslate} onScanAgainButtonClicked={mockOnScanAgainButtonClicked} />,
    );

    const container = screen.getByTestId('error-while-scanning-items-container');
    expect(container).toHaveClass('flex flex-col items-center gap-4');

    const textContainer = screen.getByText('settings.antivirus.errorState.title').closest('div');
    expect(textContainer).toHaveClass('flex flex-col gap-1 text-center');

    const title = screen.getByText('settings.antivirus.errorState.title');
    expect(title).toHaveClass('font-medium text-gray-100');
  });
});
