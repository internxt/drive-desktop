import { NotificationSchema } from '@/apps/main/notification-schema';
import { beforeEach } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { handleParsedNotificationEvent } from './handle-parsed-notification-event';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { markItemsAsTrashed } from '@/backend/features/remote-notifications/in/mark-items-as-trashed';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';

vi.mock(import('@/backend/features/remote-notifications/in/mark-items-as-trashed'));
vi.mock(import('@/apps/main/remote-sync/handlers'));

describe('handleParsedNotificationEvent', () => {
  const markItemsAsTrashedMock = deepMocked(markItemsAsTrashed);
  const debouncedSynchronizationMock = deepMocked(debouncedSynchronization);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log debug message if clientId is drive-desktop', async () => {
    const event = mockDeep<NotificationSchema>({
      clientId: 'drive-desktop',
    });
    await handleParsedNotificationEvent({ event });
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Notification received',
        event: event.event,
        clientId: event.clientId,
        payload: event.payload,
      }),
    );
  });

  it('should not log debug message if clientId is not drive-desktop', async () => {
    const event = mockDeep<NotificationSchema>({
      clientId: 'drive-web',
    });
    await handleParsedNotificationEvent({ event });
    expect(loggerMock.debug).toHaveBeenCalledTimes(0);
  });

  it('should call markItemsAsTrashed if event is ITEMS_TO_TRASH', async () => {
    const event = mockDeep<NotificationSchema>({
      event: 'ITEMS_TO_TRASH',
      payload: [{ type: 'file', uuid: 'file1' }],
    });
    await handleParsedNotificationEvent({ event });
    expect(markItemsAsTrashedMock).toBeCalledWith(
      expect.objectContaining({
        items: event.payload,
      }),
    );

    expect(loggerMock.info).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Notification received',
        data: event,
      }),
    );
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
  });

  it('should ONLY log debug message if event is ITEMS_TO_TRASH and clientId is drive-desktop', async () => {
    const event = mockDeep<NotificationSchema>({
      event: 'ITEMS_TO_TRASH',
      clientId: 'drive-desktop',
      payload: [{ type: 'file', uuid: 'file1' }],
    });
    await handleParsedNotificationEvent({ event });
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Notification received',
        event: event.event,
        clientId: event.clientId,
        payload: event.payload,
      }),
    );
    expect(markItemsAsTrashedMock).not.toBeCalled();
  });
});
