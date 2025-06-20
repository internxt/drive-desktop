import { beforeEach } from 'vitest';
import { processWebSocketEvent } from '@/backend/features/remote-notifications/in/process-web-socket-event';
import { broadcastToWindows } from '@/apps/main/windows';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';
import { loggerMock } from '../../../../../tests/vitest/mocks.helper.test';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';

vi.mock(import('@/apps/main/windows'));
vi.mock(import('@/apps/main/remote-sync/handlers'));

describe('processWebSocketEvent', () => {
  const broadcastToWindowsMock = deepMocked(broadcastToWindows);
  const debouncedSynchronizationMock = deepMocked(debouncedSynchronization);

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
    expect(loggerMock.debug).toHaveBeenCalledWith({
      msg: 'Notification received',
      event: validEvent.event,
      clientId: validEvent.clientId,
      payload: validEvent.payload,
    });
  });

  it('should call debouncedSynchronization if schema is not valid', async () => {
    const validEvent = {
      event: 'ANY_OTHER_EVENT',
    };

    await processWebSocketEvent({ data: validEvent });
    expect(loggerMock.debug).toHaveBeenCalledTimes(0);
    expect(loggerMock.info).toHaveBeenCalledWith({
      msg: 'Notification received',
      data: validEvent,
    });
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
  });
});
