import { render, screen, fireEvent } from '@testing-library/react';
import { ScanResult } from './ScanResult';
import { ScanSuccessful } from './ScanSuccessful';
import { CorruptedItemsFound } from './CorruptedItemsFound';
import { type Mock } from 'vitest';

interface ScanResultProps {
  translate: Mock;
  onScanAgainButtonClicked: Mock;
  onRemoveMalwareButtonClicked: Mock;
  thereAreCorruptedFiles: boolean;
}

vi.mock('./ScanSuccessful', () => ({
  ScanSuccessful: vi.fn(() => <div data-testid="scan-successful" />),
}));

vi.mock('./CorruptedItemsFound', () => ({
  CorruptedItemsFound: vi.fn(() => <div data-testid="corrupted-items-found" />),
}));

describe('ScanResult', () => {
  const defaultMockProps: ScanResultProps = {
    translate: vi.fn((key) => key),
    onScanAgainButtonClicked: vi.fn(),
    onRemoveMalwareButtonClicked: vi.fn(),
    thereAreCorruptedFiles: false,
  };

  let mockProps: ScanResultProps;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProps = { ...defaultMockProps };
  });

  it('renders ScanSuccessful when there are no corrupted files', () => {
    render(<ScanResult {...mockProps} />);

    expect(screen.getByTestId('scan-successful')).toBeInTheDocument();

    expect(screen.queryByTestId('corrupted-items-found')).not.toBeInTheDocument();

    expect(ScanSuccessful).toHaveBeenCalledWith({ translate: mockProps.translate }, expect.anything());
  });

  it('renders CorruptedItemsFound when there are corrupted files', () => {
    render(<ScanResult {...mockProps} thereAreCorruptedFiles={true} />);

    expect(screen.getByTestId('corrupted-items-found')).toBeInTheDocument();

    expect(screen.queryByTestId('scan-successful')).not.toBeInTheDocument();

    expect(CorruptedItemsFound).toHaveBeenCalledWith(
      {
        translate: mockProps.translate,
        onRemoveMalwareButtonClicked: mockProps.onRemoveMalwareButtonClicked,
      },
      expect.anything(),
    );
  });

  it('renders the scan again button when there are no corrupted files', () => {
    render(<ScanResult {...mockProps} />);

    const scanAgainButton = screen.getByTestId('scan-again-button');
    expect(scanAgainButton).toBeInTheDocument();

    expect(mockProps.translate).toHaveBeenCalledWith('settings.antivirus.scanProcess.scanAgain');
  });

  it('calls onScanAgainButtonClicked when scan again button is clicked', () => {
    render(<ScanResult {...mockProps} />);

    const scanAgainButton = screen.getByTestId('scan-again-button');
    fireEvent.click(scanAgainButton);

    expect(mockProps.onScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('does not render scan again button when there are corrupted files', () => {
    render(<ScanResult {...mockProps} thereAreCorruptedFiles={true} />);

    expect(screen.queryByTestId('scan-again-button')).not.toBeInTheDocument();
  });

  it('applies the correct styling to the container', () => {
    render(<ScanResult {...mockProps} />);

    const container = screen.getByTestId('scan-result-container');
    expect(container).toHaveClass('flex flex-col items-center gap-5');
  });
});
