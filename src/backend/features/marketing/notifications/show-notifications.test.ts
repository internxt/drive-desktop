import { DriveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { showNotifications } from './show-notifications';
import { Notification } from 'electron';

describe('show-notifications', () => {
  const NotificationMock = vi.mocked(Notification);
  const getAllMock = partialSpyOn(DriveServerWipModule.NotificationModule, 'getAll');

  const mockShow = vi.fn();
  const mockOn = vi.fn();

  beforeEach(() => {
    NotificationMock.mockReturnValue({ show: mockShow, on: mockOn } as Partial<Notification> as Notification);
  });

  it('should show notification and prepare failed callback', async () => {
    // Given
    getAllMock.mockResolvedValue({ data: [{ link: 'https://internxt.com/deals/black-friday-internxt?next=another-url&prop=value' }] });
    // When
    await showNotifications();
    // Then
    calls(mockShow).toHaveLength(1);
    calls(mockOn).toHaveLength(1);
    call(Notification).toStrictEqual({
      toastXml: expect.stringContaining(
        'com.internxt.drive:action=navigate&amp;contentId=https://internxt.com/deals/black-friday-internxt?next=another-url&amp;prop=value',
      ),
    });
  });
});
