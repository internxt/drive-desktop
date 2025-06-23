import { beforeEach } from 'vitest';
import { processWebSocketEvent } from '@/backend/features/remote-notifications/in/process-web-socket-event';
import { broadcastToWindows } from '@/apps/main/windows';
import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { handleParsedNotificationEvent, logAndSync } from '@/backend/features/remote-notifications/in/handle-parsed-notification-event';

vi.mock(import('@/apps/main/windows'));
vi.mock(import('@/apps/main/remote-sync/handlers'));
vi.mock(import('@/backend/features/remote-notifications/in/handle-parsed-notification-event'));

describe('processWebSocketEvent', () => {
  const broadcastToWindowsMock = deepMocked(broadcastToWindows);
  const handleParsedNotificationEventMock = deepMocked(handleParsedNotificationEvent);
  const logAndSyncMock = deepMocked(logAndSync);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should trigger refresh-backup on FOLDER_DELETED event', async () => {
    const event = {
      event: 'FOLDER_DELETED',
      email: 'email@test.com',
      clientId: 'drive-web',
      userId: '123',
    };
    await processWebSocketEvent({ data: event });
    expect(broadcastToWindowsMock).toHaveBeenCalledWith('refresh-backup', undefined);
    expect(logAndSyncMock).toHaveBeenCalledTimes(1);
    expect(handleParsedNotificationEventMock).not.toHaveBeenCalled();
  });

  it('should call handleParsedNotificationEvent if schema is valid', async () => {
    const validEvent = {
      event: 'ITEMS_TO_TRASH',
      email: 'test@example.com',
      clientId: 'drive-desktop',
      userId: 'user1',
      payload: [{ type: 'file', uuid: 'abc' }],
    };

    await processWebSocketEvent({ data: validEvent });
    expect(handleParsedNotificationEventMock).toHaveBeenCalledWith(expect.objectContaining({ event: validEvent }));
  });

  it('should call debouncedSynchronization if schema is not valid', async () => {
    const validEvent = {
      event: 'ANY_OTHER_EVENT',
    };

    await processWebSocketEvent({ data: validEvent });
    expect(handleParsedNotificationEventMock).not.toHaveBeenCalled();
    expect(logAndSyncMock).toHaveBeenCalledWith(expect.objectContaining({ data: validEvent }));
  });
});
