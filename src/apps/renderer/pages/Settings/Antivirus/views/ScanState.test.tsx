import { render, screen, fireEvent } from '@testing-library/react';
import { ScanState } from './ScanState';

jest.mock('../../../../context/LocalContext');

describe('ScanState', () => {
  const defaultProps = {
    currentScanPath: '/test/path/file.txt',
    scannedFilesCount: 100,
    progressRatio: 50,
    isScanning: true,
    isScanCompleted: false,
    corruptedFiles: [],
    showErrorState: false,
    onStopProgressScanButtonClicked: jest.fn(),
    onScanAgainButtonClicked: jest.fn(),
    showItemsWithMalware: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders scanning state correctly', () => {
    render(<ScanState {...defaultProps} />);

    expect(
      screen.getByText('settings.antivirus.scanProcess.scanning')
    ).toBeInTheDocument();
    expect(screen.getByText('/test/path/file.txt')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows stop scan button during scan', () => {
    render(<ScanState {...defaultProps} />);

    const stopButton = screen.getByText(
      'settings.antivirus.scanOptions.stopScan'
    );
    expect(stopButton).toBeInTheDocument();

    fireEvent.click(stopButton);
    expect(defaultProps.onStopProgressScanButtonClicked).toHaveBeenCalledTimes(
      1
    );
  });

  it('shows scan completed state with no corrupted files', () => {
    render(
      <ScanState
        {...defaultProps}
        isScanning={false}
        isScanCompleted={true}
        progressRatio={100}
      />
    );

    expect(
      screen.getByText('settings.antivirus.scanProcess.noFilesFound.title')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.scanProcess.noFilesFound.subtitle')
    ).toBeInTheDocument();

    const scanAgainButton = screen.getByText(
      'settings.antivirus.scanProcess.scanAgain'
    );
    expect(scanAgainButton).toBeInTheDocument();

    fireEvent.click(scanAgainButton);
    expect(defaultProps.onScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows scan completed state with corrupted files', () => {
    const corruptedFiles = ['/test/infected1.txt', '/test/infected2.txt'];
    render(
      <ScanState
        {...defaultProps}
        isScanning={false}
        isScanCompleted={true}
        progressRatio={100}
        corruptedFiles={corruptedFiles}
      />
    );

    expect(
      screen.getByText('settings.antivirus.scanProcess.malwareFound.title')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.scanProcess.malwareFound.subtitle')
    ).toBeInTheDocument();

    const removeMalwareButton = screen.getByText(
      'settings.antivirus.scanProcess.malwareFound.action'
    );
    expect(removeMalwareButton).toBeInTheDocument();

    fireEvent.click(removeMalwareButton);
    expect(defaultProps.showItemsWithMalware).toHaveBeenCalledTimes(1);
  });

  it('shows error state when scan fails', () => {
    render(
      <ScanState
        {...defaultProps}
        isScanning={false}
        isScanCompleted={false}
        showErrorState={true}
      />
    );

    expect(
      screen.getByText('settings.antivirus.errorState.title')
    ).toBeInTheDocument();

    const tryAgainButton = screen.getByText(
      'settings.antivirus.errorState.button'
    );
    expect(tryAgainButton).toBeInTheDocument();

    fireEvent.click(tryAgainButton);
    expect(defaultProps.onScanAgainButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows scan statistics', () => {
    const corruptedFiles = ['/test/infected1.txt', '/test/infected2.txt'];
    render(<ScanState {...defaultProps} corruptedFiles={corruptedFiles} />);

    expect(
      screen.getByText('settings.antivirus.scanProcess.scannedFiles')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.scanProcess.detectedFiles')
    ).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // scannedFilesCount
    expect(screen.getByText('2')).toBeInTheDocument(); // corruptedFiles.length
  });

  it('updates current scan path during scanning', () => {
    const { rerender } = render(<ScanState {...defaultProps} />);
    expect(screen.getByText('/test/path/file.txt')).toBeInTheDocument();

    rerender(
      <ScanState
        {...defaultProps}
        currentScanPath="/test/path/another-file.txt"
      />
    );
    expect(screen.getByText('/test/path/another-file.txt')).toBeInTheDocument();
  });
});
