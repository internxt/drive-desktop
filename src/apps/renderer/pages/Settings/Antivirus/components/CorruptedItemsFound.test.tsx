import { render, screen, fireEvent } from '@testing-library/react';
import { CorruptedItemsFound } from './CorruptedItemsFound';

describe('CorruptedItemsFound', () => {
  const mockTranslate = vi.fn((key) => key);
  const mockOnRemoveMalwareButtonClicked = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with correct content', () => {
    render(
      <CorruptedItemsFound translate={mockTranslate} onRemoveMalwareButtonClicked={mockOnRemoveMalwareButtonClicked} />,
    );

    expect(screen.getByText('settings.antivirus.scanProcess.malwareFound.title')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.malwareFound.subtitle')).toBeInTheDocument();

    expect(screen.getByText('settings.antivirus.scanProcess.malwareFound.action')).toBeInTheDocument();

    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.malwareFound.title');
    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.malwareFound.subtitle');
    expect(mockTranslate).toHaveBeenCalledWith('settings.antivirus.scanProcess.malwareFound.action');
  });

  it('calls onRemoveMalwareButtonClicked when button is clicked', () => {
    render(
      <CorruptedItemsFound translate={mockTranslate} onRemoveMalwareButtonClicked={mockOnRemoveMalwareButtonClicked} />,
    );

    const button = screen.getByTestId('remove-malware-button');
    fireEvent.click(button);

    expect(mockOnRemoveMalwareButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('renders the shield warning icon', () => {
    render(
      <CorruptedItemsFound translate={mockTranslate} onRemoveMalwareButtonClicked={mockOnRemoveMalwareButtonClicked} />,
    );

    const iconElement = screen.getByTestId('shield-warning-icon');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveClass('text-red');
  });

  it('applies the correct styling', () => {
    render(
      <CorruptedItemsFound translate={mockTranslate} onRemoveMalwareButtonClicked={mockOnRemoveMalwareButtonClicked} />,
    );

    const container = screen.getByTestId('corrupted-items-text-container');
    expect(container).toHaveClass('flex flex-col gap-1 text-center');

    const title = screen.getByText('settings.antivirus.scanProcess.malwareFound.title');
    expect(title).toHaveClass('font-medium text-gray-100');

    const subtitle = screen.getByText('settings.antivirus.scanProcess.malwareFound.subtitle');
    expect(subtitle).toHaveClass('text-sm text-gray-80');

    const mainContainer = screen.getByTestId('corrupted-items-container');
    expect(mainContainer).toHaveClass('flex flex-col items-center gap-4');
  });
});
