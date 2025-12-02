import { render, screen, fireEvent } from '@testing-library/react';
import { ActionDialog } from './ActionDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('ActionDialog', () => {
  const defaultProps = {
    showDialog: true,
    title: 'Test Title',
    children: <div>Test Description</div>,
    cancelText: 'Cancel',
    confirmText: 'Confirm',
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with provided props', () => {
    render(<ActionDialog {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ActionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ActionDialog {...defaultProps} />);

    fireEvent.click(screen.getByText('Confirm'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not render when showDialog is false', () => {
    render(<ActionDialog {...defaultProps} showDialog={false} />);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('renders with custom button text', () => {
    render(<ActionDialog {...defaultProps} confirmText="Custom Confirm" cancelText="Custom Cancel" />);

    expect(screen.getByText('Custom Confirm')).toBeInTheDocument();
    expect(screen.getByText('Custom Cancel')).toBeInTheDocument();
  });

  it('renders with different button variants', () => {
    render(<ActionDialog {...defaultProps} confirmButtonVariant="primary" />);

    const confirmButton = screen.getByText('Confirm');
    expect(confirmButton).toHaveClass('bg-primary');
  });
});
