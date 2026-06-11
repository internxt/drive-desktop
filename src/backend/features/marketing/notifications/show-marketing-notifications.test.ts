import { logger } from '@internxt/drive-desktop-core/build/backend';
import { broadcastToWindows } from '../../../../apps/main/windows';
import { getNotifications } from '../../../../infra/drive-server/services/notifications/get-notifications';
import { showMarketingNotifications } from './show-marketing-notifications';

vi.mock('../../../../infra/drive-server/services/notifications/get-notifications', () => ({
  getNotifications: vi.fn(),
}));

vi.mock('../../../../apps/main/windows', () => ({
  broadcastToWindows: vi.fn(),
}));

describe('showMarketingNotifications', () => {
  const getNotificationsMock = vi.mocked(getNotifications);
  const broadcastToWindowsMock = vi.mocked(broadcastToWindows);

  it('should broadcast marketing notifications to renderer windows', async () => {
    const notifications = [
      {
        id: 'first-notification',
        link: 'https://internxt.com/first',
        message: 'First message',
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        isRead: false,
        deliveredAt: '2024-01-01T00:00:00.000Z',
        readAt: null,
      },
      {
        id: 'second-notification',
        link: 'https://internxt.com/second',
        message: 'Second message',
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        isRead: false,
        deliveredAt: '2024-01-01T00:00:00.000Z',
        readAt: null,
      },
    ];
    getNotificationsMock.mockResolvedValue({ data: notifications });

    await showMarketingNotifications();

    expect(broadcastToWindowsMock).toHaveBeenCalledWith('marketing-notifications', notifications);
  });

  it('should not broadcast when there are no marketing notifications', async () => {
    getNotificationsMock.mockResolvedValue({ data: [] });

    await showMarketingNotifications();

    expect(broadcastToWindowsMock).not.toHaveBeenCalled();
  });

  it('should log when fetching marketing notifications fails', async () => {
    const error = new Error('Request failed');
    getNotificationsMock.mockResolvedValue({ error });

    await showMarketingNotifications();

    expect(logger.error).toHaveBeenCalledWith({ msg: 'Error showing marketing notifications', error });
  });
});
