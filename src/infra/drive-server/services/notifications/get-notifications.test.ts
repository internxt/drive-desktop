import { partialSpyOn } from 'tests/vitest/utils.helper';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { DriveServerError } from '../../drive-server.error';
import { getNotifications } from './get-notifications';

describe('getNotifications', () => {
  const driveServerGetMock = partialSpyOn(driveServerClient, 'GET');

  it('should fetch user notifications', async () => {
    const notifications = [
      {
        id: 'notification-id',
        link: 'https://internxt.com/promotions/black-friday',
        message: 'Black Friday Sale - 50% off all plans!',
        expiresAt: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        isRead: false,
        deliveredAt: '2024-01-01T00:00:00.000Z',
        readAt: null,
      },
    ];
    driveServerGetMock.mockResolvedValue({ data: notifications } as object);

    const result = await getNotifications();

    expect(driveServerGetMock).toHaveBeenCalledWith('/notifications');
    expect(result).toStrictEqual({ data: notifications });
  });

  it('should return the drive server error when the request fails', async () => {
    const error = new DriveServerError('UNKNOWN', 500);
    driveServerGetMock.mockResolvedValue({ error } as object);

    const result = await getNotifications();

    expect(result).toStrictEqual({ error });
  });
});
