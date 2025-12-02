import { render, screen, fireEvent } from '@testing-library/react';
import { ChooseItemsState } from './ChooseItemsState';
import { useAntivirusContext } from '../../../../context/AntivirusContext';
import { type Mock } from 'vitest';

vi.mock('../../../../context/LocalContext');
vi.mock('../../../../context/AntivirusContext');

describe('ChooseItemsState', () => {
  const mockAntivirusContext = {
    isAntivirusAvailable: true,
    onCustomScanButtonClicked: vi.fn(),
    onScanUserSystemButtonClicked: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAntivirusContext as Mock).mockReturnValue(mockAntivirusContext);
  });

  it('renders the component with all options', () => {
    render(<ChooseItemsState />);

    expect(screen.getByText('settings.antivirus.scanOptions.systemScan.text')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanOptions.customScan.text')).toBeInTheDocument();

    expect(screen.getByText('settings.antivirus.scanOptions.systemScan.action')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanOptions.customScan.action')).toBeInTheDocument();
  });

  it('disables buttons when user is not eligible', () => {
    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      isAntivirusAvailable: false,
    });

    render(<ChooseItemsState />);

    const systemScanButton = screen.getByText('settings.antivirus.scanOptions.systemScan.action');
    const customScanButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');

    expect(systemScanButton).toBeDisabled();
    expect(customScanButton).toBeDisabled();
  });

  it('calls onScanUserSystemButtonClicked when system scan button is clicked', () => {
    render(<ChooseItemsState />);

    const systemScanButton = screen.getByText('settings.antivirus.scanOptions.systemScan.action');
    fireEvent.click(systemScanButton);

    expect(mockAntivirusContext.onScanUserSystemButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows custom scan dropdown when custom scan button is clicked', () => {
    render(<ChooseItemsState />);

    const customScanButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(customScanButton);

    expect(screen.getByText('settings.antivirus.scanOptions.customScan.selector.files')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanOptions.customScan.selector.folders')).toBeInTheDocument();
  });

  it('calls onCustomScanButtonClicked with "files" when files option is selected', () => {
    render(<ChooseItemsState />);

    const customScanButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(customScanButton);

    const filesOption = screen.getByText('settings.antivirus.scanOptions.customScan.selector.files');
    fireEvent.click(filesOption);

    expect(mockAntivirusContext.onCustomScanButtonClicked).toHaveBeenCalledWith('files');
  });

  it('calls onCustomScanButtonClicked with "folders" when folders option is selected', () => {
    render(<ChooseItemsState />);

    const customScanButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(customScanButton);

    const foldersOption = screen.getByText('settings.antivirus.scanOptions.customScan.selector.folders');
    fireEvent.click(foldersOption);

    expect(mockAntivirusContext.onCustomScanButtonClicked).toHaveBeenCalledWith('folders');
  });

  it('renders with correct styling', () => {
    render(<ChooseItemsState />);

    const container = screen.getByTestId('choose-items-container');
    expect(container).toHaveClass('flex flex-col gap-4 p-10');

    const optionsContainer = screen.getAllByTestId('scan-option-container');
    optionsContainer.forEach((container) => {
      expect(container).toHaveClass(
        'flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3',
      );
    });
  });
});
