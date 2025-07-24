import { processWebSocketEvent } from '@/backend/features/remote-notifications/in/process-web-socket-event';
import { debouncedSynchronization } from '@/apps/main/remote-sync/handlers';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

vi.mock(import('@/apps/main/windows'));
vi.mock(import('@/apps/main/remote-sync/handlers'));

describe('processWebSocketEvent', () => {
  const debouncedSynchronizationMock = vi.mocked(debouncedSynchronization);

  it('should log debug if schema is valid and clientId is drive-desktop-windows', async () => {
    const event = {
      event: 'ITEMS_TO_TRASH',
      email: 'test@example.com',
      clientId: 'drive-desktop-windows',
      userId: 'user1',
      payload: [{ type: 'file', uuid: 'abc' }],
    };

    await processWebSocketEvent({ data: event });
    expect(loggerMock.debug).toHaveBeenCalledTimes(1);
    expect(debouncedSynchronizationMock).not.toHaveBeenCalled();
  });

  it('should call debouncedSynchronization if schema is not valid', async () => {
    const event = {
      event: 'ANY_OTHER_EVENT',
    };

    await processWebSocketEvent({ data: event });
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Remote notification received', data: event });
  });

  it('should call debouncedSynchronization if schema is valid and clientId is not drive-desktop-windows', async () => {
    const event = {
      event: 'ITEMS_TO_TRASH',
      email: 'test@example.com',
      clientId: 'drive-web',
      userId: 'user1',
      payload: [{ type: 'file', uuid: 'abc' }],
    };

    await processWebSocketEvent({ data: event });
    expect(debouncedSynchronizationMock).toHaveBeenCalledTimes(1);
    expect(loggerMock.debug).toHaveBeenCalledWith({ msg: 'Remote notification received', data: event });
  });
});
