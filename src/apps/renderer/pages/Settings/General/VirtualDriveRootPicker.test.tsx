import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VirtualDriveRootPicker from './VirtualDriveRootPicker';

vi.mock('../../../context/LocalContext', () => ({
  useTranslationContext: () => ({ translate: (key: string) => key }),
}));

describe('VirtualDriveRootPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electron.getVirtualDriveRoot = vi.fn().mockResolvedValue('/old/root/Internxt Drive/');
    window.electron.chooseSyncRootWithDialog = vi.fn().mockResolvedValue('/new/root/');
    window.electron.logger.error = vi.fn();
  });

  it('should render the current virtual drive root path', async () => {
    render(<VirtualDriveRootPicker />);

    await waitFor(() => {
      expect(screen.getByText('/old/root/Internxt Drive/')).toBeInTheDocument();
    });
  });

  it('should refresh displayed path after changing the folder', async () => {
    window.electron.getVirtualDriveRoot = vi
      .fn()
      .mockResolvedValueOnce('/old/root/Internxt Drive/')
      .mockResolvedValueOnce('/new/root/Internxt Drive/');

    render(<VirtualDriveRootPicker />);

    const changeFolderButton = await screen.findByRole('button', {
      name: 'settings.general.virtual-drive-root.action',
    });

    fireEvent.click(changeFolderButton);

    await waitFor(() => {
      expect(window.electron.chooseSyncRootWithDialog).toHaveBeenCalledOnce();
      expect(window.electron.getVirtualDriveRoot).toHaveBeenCalledTimes(2);
      expect(screen.getByText('/new/root/Internxt Drive/')).toBeInTheDocument();
    });
  });
});
