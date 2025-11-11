import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { showNotifications } from './show-notifications';
import { Notification, shell } from 'electron';

describe('show-notifications', () => {
  const NotificationMock = vi.mocked(Notification);
  const openExternalMock = vi.mocked(shell.openExternal);
  const getAllMock = partialSpyOn(DriveServerWipModule.NotificationModule, 'getAll');

  const mockShow = vi.fn();
  const mockOn = vi.fn();

  beforeEach(() => {
    NotificationMock.mockReturnValue({ show: mockShow, on: mockOn } as Partial<Notification> as Notification);
    getAllMock.mockResolvedValue({ data: [{ message: 'Message', link: 'link' }] });
  });

  it('should show notification and prepare callbacks', async () => {
    // When
    await showNotifications();
    // Then
    calls(mockShow).toHaveLength(1);
    calls(mockOn).toHaveLength(3);
  });

  it('should open link when notification is clicked', async () => {
    // When
    await showNotifications();
    const clickFn = mockOn.mock.calls[0][1];
    clickFn();
    // Then
    call(openExternalMock).toStrictEqual('link');
  });
});
