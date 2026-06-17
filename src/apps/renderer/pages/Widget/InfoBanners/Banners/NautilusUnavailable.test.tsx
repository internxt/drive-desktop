import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NautilusUnavailable } from './NautilusUnavailable';

describe('NautilusUnavailable', () => {
  beforeEach(() => {
    vi.mocked(window.electron.getNautilusAvailability).mockResolvedValue(true);
  });

  it('renders nothing when Nautilus is available', async () => {
    const { container } = render(<NautilusUnavailable />);

    await waitFor(() => {
      expect(window.electron.getNautilusAvailability).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the warning banner when Nautilus is not available', async () => {
    vi.mocked(window.electron.getNautilusAvailability).mockResolvedValue(false);

    render(<NautilusUnavailable />);

    await waitFor(() => {
      expect(screen.getByText('widget.banners.nautilus-unavailable.body')).toBeInTheDocument();
    });
  });

  it('dismisses the warning banner when the X button is clicked', async () => {
    vi.mocked(window.electron.getNautilusAvailability).mockResolvedValue(false);

    render(<NautilusUnavailable />);

    await waitFor(() => {
      expect(screen.getByText('widget.banners.nautilus-unavailable.body')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText('Dismiss'));

    expect(screen.queryByText('widget.banners.nautilus-unavailable.body')).not.toBeInTheDocument();
  });
});
