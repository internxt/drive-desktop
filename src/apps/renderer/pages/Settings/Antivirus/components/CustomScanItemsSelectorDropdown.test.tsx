import { render, screen, fireEvent } from '@testing-library/react';
import { CustomScanItemsSelectorDropdown } from './CustomScanItemsSelectorDropdown';

// Mock the DropdownItem component
vi.mock('./DropdownItem', () => ({
  DropdownItem: ({ children, onClick }: any) => (
    <button data-testid="dropdown-item" onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('CustomScanItemsSelectorDropdown', () => {
  const mockProps = {
    disabled: false,
    translate: (key: string) => key, // Simple mock that returns the key
    onScanItemsButtonClicked: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dropdown button with correct text', () => {
    render(<CustomScanItemsSelectorDropdown {...mockProps} />);

    expect(screen.getByText('settings.antivirus.scanOptions.customScan.action')).toBeInTheDocument();
  });

  it('disables the button when disabled prop is true', () => {
    render(<CustomScanItemsSelectorDropdown {...mockProps} disabled={true} />);

    const button = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    expect(button).toBeDisabled();
  });

  it('shows dropdown items when button is clicked', () => {
    render(<CustomScanItemsSelectorDropdown {...mockProps} />);

    // Click the dropdown button
    const dropdownButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(dropdownButton);

    // Check if dropdown items are visible
    expect(screen.getByText('settings.antivirus.scanOptions.customScan.selector.files')).toBeInTheDocument();
    expect(screen.getByText('settings.antivirus.scanOptions.customScan.selector.folders')).toBeInTheDocument();
  });

  it('calls onScanItemsButtonClicked with "files" when files option is clicked', () => {
    render(<CustomScanItemsSelectorDropdown {...mockProps} />);

    // Click the dropdown button to open the menu
    const dropdownButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(dropdownButton);

    // Click the files option
    const filesOption = screen.getByText('settings.antivirus.scanOptions.customScan.selector.files');
    fireEvent.click(filesOption);

    expect(mockProps.onScanItemsButtonClicked).toHaveBeenCalledWith('files');
  });

  it('calls onScanItemsButtonClicked with "folders" when folders option is clicked', () => {
    render(<CustomScanItemsSelectorDropdown {...mockProps} />);

    // Click the dropdown button to open the menu
    const dropdownButton = screen.getByText('settings.antivirus.scanOptions.customScan.action');
    fireEvent.click(dropdownButton);

    // Click the folders option
    const foldersOption = screen.getByText('settings.antivirus.scanOptions.customScan.selector.folders');
    fireEvent.click(foldersOption);

    expect(mockProps.onScanItemsButtonClicked).toHaveBeenCalledWith('folders');
  });
});
