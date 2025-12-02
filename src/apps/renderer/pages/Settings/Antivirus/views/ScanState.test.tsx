import { render, screen, fireEvent } from '@testing-library/react';
import { ScanState } from './ScanState';
import { useAntivirusContext } from '../../../../context/AntivirusContext';
import { type Mock } from 'vitest';

vi.mock('../../../../context/LocalContext');
vi.mock('../../../../context/AntivirusContext');

describe('ScanState', () => {
  const mockShowItemsWithMalware = vi.fn();

  const mockAntivirusContext = {
    currentScanPath: '/test/path/file.txt',
    countScannedFiles: 100,
    progressRatio: 50,
    isScanning: true,
    isScanCompleted: false,
    infectedFiles: [],
    showErrorState: false,
    onCancelScan: vi.fn(),
    onScanAgainButtonClicked: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAntivirusContext as Mock).mockReturnValue(mockAntivirusContext);
  });

  it('renders scanning state correctly', () => {
    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    expect(screen.getByText('settings.antivirus.scanProcess.scanning')).toBeInTheDocument();
    expect(screen.getByText('/test/path/file.txt')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows stop scan button during scan', () => {
    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    const stopButton = screen.getByText('settings.antivirus.scanOptions.stopScan');
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(mockAntivirusContext.onCancelScan).toHaveBeenCalledTimes(1);
  });

  it('shows scan completed state with no corrupted files', () => {
    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      isScanning: false,
      isScanCompleted: true,
      progressRatio: 100,
    });

    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    expect(screen.getByText('settings.antivirus.scanProcess.noFilesFound.title')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.noFilesFound.subtitle')).toBeInTheDocument();

    const scanAgainButton = screen.getByTestId('scan-again-button');
    expect(scanAgainButton).toBeInTheDocument();

    fireEvent.click(scanAgainButton);
    expect(mockAntivirusContext.onScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows scan completed state with corrupted files', () => {
    const corruptedFiles = ['/test/infected1.txt', '/test/infected2.txt'];

    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      isScanning: false,
      isScanCompleted: true,
      progressRatio: 100,
      infectedFiles: corruptedFiles,
    });

    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    expect(screen.getByText('settings.antivirus.scanProcess.malwareFound.title')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.malwareFound.subtitle')).toBeInTheDocument();

    const removeMalwareButton = screen.getByText('settings.antivirus.scanProcess.malwareFound.action');
    expect(removeMalwareButton).toBeInTheDocument();

    fireEvent.click(removeMalwareButton);
    expect(mockShowItemsWithMalware).toHaveBeenCalledTimes(1);
  });

  it('shows error state when scan fails', () => {
    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      isScanning: false,
      isScanCompleted: true,
      showErrorState: true,
    });

    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    expect(screen.getByText('settings.antivirus.errorState.title')).toBeInTheDocument();

    const tryAgainButton = screen.getByText('settings.antivirus.errorState.button');
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);
    expect(mockAntivirusContext.onScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows scan statistics', () => {
    const corruptedFiles = ['/test/infected1.txt', '/test/infected2.txt'];

    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      infectedFiles: corruptedFiles,
    });

    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);

    expect(screen.getByText('settings.antivirus.scanProcess.scannedFiles')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanProcess.detectedFiles')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // countScannedFiles
    expect(screen.getByText('2')).toBeInTheDocument(); // infectedFiles.length
  });

  it('updates current scan path during scanning', () => {
    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);
    expect(screen.getByText('/test/path/file.txt')).toBeInTheDocument();

    (useAntivirusContext as Mock).mockReturnValue({
      ...mockAntivirusContext,
      currentScanPath: '/test/path/another-file.txt',
    });

    render(<ScanState showItemsWithMalware={mockShowItemsWithMalware} />);
    expect(screen.getByText('/test/path/another-file.txt')).toBeInTheDocument();
  });
});
