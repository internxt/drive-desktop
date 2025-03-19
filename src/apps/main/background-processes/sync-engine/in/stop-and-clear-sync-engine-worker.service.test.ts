import { mockObject, mockProps } from 'tests/vitest/mocks.helper.test';
import { StopAndClearSyncEngineWorkerService } from './stop-and-clear-sync-engine-worker.service';
import { workers } from '../../sync-engine';
import { mockDeep } from 'vitest-mock-extended';
import { LoggerService } from '@/apps/shared/logger/logger';
import { DeepPartial } from 'ts-essentials';
import { WorkerConfig } from './spawn-sync-engine-worker.service';

describe('stop-and-clear-sync-engine-worker.service', () => {
  const logger = mockDeep<LoggerService>();
  const service = new StopAndClearSyncEngineWorkerService(logger);

  const workspaceId = 'workspaceId';
  const props = mockProps<StopAndClearSyncEngineWorkerService>({ workspaceId });

  function createWorker(props?: DeepPartial<WorkerConfig>) {
    return mockObject<WorkerConfig>({
      browserWindow: {
        destroy: vi.fn(),
        webContents: {
          send: vi.fn(),
        },
      },
      workerIsRunning: false,
      startingWorker: false,
      syncSchedule: null,
      ...props,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete workers[workspaceId];
  });

  it('If the worker does not exist, do nothing', async () => {
    // When
    await service.run(props);

    // Then
    expect(logger.debug).toHaveBeenCalledWith({ msg: '[MAIN] The workspace did not have a sync engine worker', workspaceId });
  });

  it('If the worker is not running, try to destroy the browser window', async () => {
    // Given
    const worker = createWorker();
    workers[workspaceId] = worker;

    // When
    await service.run(props);

    // Then
    expect(worker.browserWindow?.destroy).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith({ msg: '[MAIN] Sync engine worker was not running', workspaceId });
  });

  it('If the worker is running, then emit ipc event and set workerIsRunning to false', async () => {
    // Given
    const worker = createWorker({ workerIsRunning: true });
    workers[workspaceId] = worker;
    vi.useFakeTimers();
    vi.runOnlyPendingTimers();

    // When
    const promise = service.run(props);
    expect(worker.browserWindow?.webContents.send).toHaveBeenCalledWith('STOP_AND_CLEAR_SYNC_ENGINE_PROCESS');
    await vi.advanceTimersByTimeAsync(10_000);
    await promise;

    // Then
    expect(worker.browserWindow).toBe(null);
    expect(worker.workerIsRunning).toBe(false);
  });
});
