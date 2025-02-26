import { render, screen, fireEvent } from '@testing-library/react';
import { ChooseItemsState } from './ChooseItemsState';

jest.mock('../../../../context/LocalContext');

describe('ChooseItemsState', () => {
  const defaultProps = {
    isUserElegible: true,
    onScanButtonClicked: jest.fn(),
    onScanUserSystemButtonClicked: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with all options', () => {
    render(<ChooseItemsState {...defaultProps} />);

    // Check for scan options text
    expect(
      screen.getByText('settings.antivirus.scanOptions.systemScan.text')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.scanOptions.customScan.text')
    ).toBeInTheDocument();

    // Check for buttons
    expect(
      screen.getByText('settings.antivirus.scanOptions.systemScan.action')
    ).toBeInTheDocument();
    expect(
      screen.getByText('settings.antivirus.scanOptions.customScan.action')
    ).toBeInTheDocument();
  });

  it('disables buttons when user is not eligible', () => {
    render(<ChooseItemsState {...defaultProps} isUserElegible={false} />);

    const systemScanButton = screen.getByText(
      'settings.antivirus.scanOptions.systemScan.action'
    );
    const customScanButton = screen.getByText(
      'settings.antivirus.scanOptions.customScan.action'
    );

    expect(systemScanButton).toBeDisabled();
    expect(customScanButton).toBeDisabled();
  });

  it('calls onScanUserSystemButtonClicked when system scan button is clicked', () => {
    render(<ChooseItemsState {...defaultProps} />);

    const systemScanButton = screen.getByText(
      'settings.antivirus.scanOptions.systemScan.action'
    );
    fireEvent.click(systemScanButton);

    expect(defaultProps.onScanUserSystemButtonClicked).toHaveBeenCalledTimes(1);
  });

  it('shows custom scan dropdown when custom scan button is clicked', () => {
    render(<ChooseItemsState {...defaultProps} />);

    const customScanButton = screen.getByText(
      'settings.antivirus.scanOptions.customScan.action'
    );
    fireEvent.click(customScanButton);

    expect(
      screen.getByText(
        'settings.antivirus.scanOptions.customScan.selector.files'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'settings.antivirus.scanOptions.customScan.selector.folders'
      )
    ).toBeInTheDocument();
  });

  it('calls onScanButtonClicked with "files" when files option is selected', () => {
    render(<ChooseItemsState {...defaultProps} />);

    const customScanButton = screen.getByText(
      'settings.antivirus.scanOptions.customScan.action'
    );
    fireEvent.click(customScanButton);

    const filesOption = screen.getByText(
      'settings.antivirus.scanOptions.customScan.selector.files'
    );
    fireEvent.click(filesOption);

    expect(defaultProps.onScanButtonClicked).toHaveBeenCalledWith('files');
  });

  it('calls onScanButtonClicked with "folders" when folders option is selected', () => {
    render(<ChooseItemsState {...defaultProps} />);

    const customScanButton = screen.getByText(
      'settings.antivirus.scanOptions.customScan.action'
    );
    fireEvent.click(customScanButton);

    const foldersOption = screen.getByText(
      'settings.antivirus.scanOptions.customScan.selector.folders'
    );
    fireEvent.click(foldersOption);

    expect(defaultProps.onScanButtonClicked).toHaveBeenCalledWith('folders');
  });

  it('renders with correct styling', () => {
    render(<ChooseItemsState {...defaultProps} />);

    const container = screen.getByTestId('choose-items-container');
    expect(container).toHaveClass('flex flex-col gap-4 p-10');

    const optionsContainer = screen.getAllByTestId('scan-option-container');
    optionsContainer.forEach((container) => {
      expect(container).toHaveClass(
        'flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3'
      );
    });
  });
});
