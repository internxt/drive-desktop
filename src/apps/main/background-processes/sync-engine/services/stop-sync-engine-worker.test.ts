import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { cleanSyncEngineWorker } from './stop-sync-engine-worker';
import { Addon } from '@/node-win/addon-wrapper';
import { workers } from '@/apps/main/remote-sync/store';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

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
});
