import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import VirtualDriveRootPicker from './VirtualDriveRootPicker';

vi.mock('../../../context/LocalContext', () => ({
  useTranslationContext: () => ({ translate: (key: string) => key }),
}));

describe('VirtualDriveRootPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.electron.getVirtualDriveRoot = vi.fn().mockResolvedValue('/old/root/Internxt Drive/');
    window.electron.chooseSyncRootWithDialog = vi.fn().mockResolvedValue({
      status: 'success',
      path: '/new/root/Internxt Drive/',
    });
    window.electron.logger.error = vi.fn();
    global.Notification = vi.fn() as unknown as typeof Notification;
  });

  it('should render the current virtual drive root path', async () => {
    render(<VirtualDriveRootPicker />);

    await waitFor(() => {
      expect(screen.getByText('/old/root/Internxt Drive/')).toBeInTheDocument();
    });
  });

  it('should refresh displayed path after changing the folder', async () => {
    render(<VirtualDriveRootPicker />);

    const changeFolderButton = await screen.findByRole('button', {
      name: 'settings.general.virtual-drive-root.action',
    });

    fireEvent.click(changeFolderButton);

    await waitFor(() => {
      expect(window.electron.chooseSyncRootWithDialog).toHaveBeenCalledOnce();
      expect(window.electron.getVirtualDriveRoot).toHaveBeenCalledTimes(1);
      expect(screen.getByText('/new/root/Internxt Drive/')).toBeInTheDocument();
    });
  });

  it('should show notification when selected path is not allowed', async () => {
    window.electron.chooseSyncRootWithDialog = vi.fn().mockResolvedValue({
      status: 'error',
      code: 'REMOVABLE_DEVICE',
    });

    render(<VirtualDriveRootPicker />);

    const changeFolderButton = await screen.findByRole('button', {
      name: 'settings.general.virtual-drive-root.action',
    });

    fireEvent.click(changeFolderButton);

    await waitFor(() => {
      expect(global.Notification).toHaveBeenCalledOnce();
      expect(screen.getByText('/old/root/Internxt Drive/')).toBeInTheDocument();
    });
  });
});
