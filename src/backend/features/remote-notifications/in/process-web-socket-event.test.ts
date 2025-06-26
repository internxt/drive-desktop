import { beforeEach } from 'vitest';
import { processWebSocketEvent } from '@/backend/features/remote-notifications/in/process-web-socket-event';
import { broadcastToWindows } from '@/apps/main/windows';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('@/apps/main/windows'));
vi.mock(import('@/apps/main/remote-sync/handlers'));
vi.mock(import('@/apps/main/remote-sync/handlers'));

describe('processWebSocketEvent', () => {
  const broadcastToWindowsMock = vi.mocked(broadcastToWindows);
  const debouncedSynchronizationMock = vi.mocked(debouncedSynchronization);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log debug if schema is valid and clientId is drive-desktop', async () => {
    const event = {
      event: 'ITEMS_TO_TRASH',
      email: 'test@example.com',
      clientId: 'drive-desktop',
      userId: 'user1',
      payload: [{ type: 'file', uuid: 'abc' }],
    };

    await processWebSocketEvent({ data: event });
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).not.toHaveBeenCalled();
    expect(debouncedSynchronizationMock).not.toHaveBeenCalled();
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
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith({ msg: 'Notification received', data: event });
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });

  it('should call debouncedSynchronization if schema is not valid', async () => {
    const event = {
      event: 'ANY_OTHER_EVENT',
    };

    await processWebSocketEvent({ data: event });
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith({ msg: 'Notification received', data: event });
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });

  it('should call debouncedSynchronization if schema is valid and clientId is not drive-desktop', async () => {
    const event = {
      event: 'ITEMS_TO_TRASH',
      email: 'test@example.com',
      clientId: 'drive-web',
      userId: 'user1',
      payload: [{ type: 'file', uuid: 'abc' }],
    };

    await processWebSocketEvent({ data: event });
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.info).toHaveBeenCalledWith({ msg: 'Notification received', data: event });
    expect(loggerMock.debug).not.toHaveBeenCalled();
  });
});
