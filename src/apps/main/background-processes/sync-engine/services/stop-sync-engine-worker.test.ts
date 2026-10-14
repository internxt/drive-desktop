import { workers } from '@/apps/main/remote-sync/store';
import { Addon } from '@/node-win/addon-wrapper';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { cleanSyncEngineWorker } from './stop-sync-engine-worker';

describe('stop-sync-engine-worker', () => {
  const disconnectSyncRootMock = partialSpyOn(Addon, 'disconnectSyncRoot');
  const unregisterSyncRootMock = partialSpyOn(Addon, 'unregisterSyncRoot');

  const unsubscribe = vi.fn();

  const props = mockProps<typeof cleanSyncEngineWorker>({
    worker: {
      connectionKey: 1n,
      watcher: { unsubscribe },
      ctx: {
        logger: loggerMock,
        providerId: 'providerId',
        workspaceId: '',
      },
    },
  });

  beforeEach(() => {
    workers.clear();
    disconnectSyncRootMock.mockResolvedValue(undefined);
    unregisterSyncRootMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    workers.clear();
  });

  it('should clear and stop sync engine worker', async () => {
    // Given
    workers.set('', props.worker);
    // When
    await cleanSyncEngineWorker(props);
    // Then
    call(disconnectSyncRootMock).toMatchObject({ connectionKey: 1n });
    call(unregisterSyncRootMock).toMatchObject({ providerId: 'providerId' });
    calls(unsubscribe).toHaveLength(1);
    expect(workers.size).toBe(0);
  });

  it.each(['disconnect', 'unregister'] as const)('removes the worker even when %s rejects', async (operation) => {
    // Given
    const error = new Error('Addon cleanup failed');
    const failingCall = operation === 'disconnect' ? disconnectSyncRootMock : unregisterSyncRootMock;
    failingCall.mockRejectedValueOnce(error);
    workers.set(props.worker.ctx.workspaceId, props.worker);
    // When
    await cleanSyncEngineWorker(props);
    // Then
    expect(workers.has(props.worker.ctx.workspaceId)).toBe(false);
    expect(loggerMock.error).toHaveBeenCalledWith({ msg: 'Error unregistering sync root', providerId: 'providerId', error });
  });

  it.each([false, true])('preserves a replacement worker when old cleanup finishes (rejected: %s)', async (rejectCleanup) => {
    // Given
    const disconnect = Promise.withResolvers<void>();
    const replacement = { ...props.worker, connectionKey: 2n };
    disconnectSyncRootMock.mockReturnValueOnce(disconnect.promise);
    workers.set(props.worker.ctx.workspaceId, props.worker);
    // When
    const cleanup = cleanSyncEngineWorker(props);
    workers.set(props.worker.ctx.workspaceId, replacement);
    if (rejectCleanup) {
      disconnect.reject(new Error('Old worker cleanup failed'));
    } else {
      disconnect.resolve();
    }
    await cleanup;
    // Then
    expect(workers.get(props.worker.ctx.workspaceId)).toBe(replacement);
  });
});
