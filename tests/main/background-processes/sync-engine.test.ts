import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserWindow, ipcRenderer } from 'electron';
import { Config } from '@/apps/sync-engine/config';
import { spawnSyncEngineWorker, stopAndClearSyncEngineWatcher, workers } from '@/apps/main/background-processes/sync-engine';

vi.mock('@/apps/main/windows/widget', () => ({
  getWidget: vi.fn(() => ({
    webContents: {
      send: vi.fn(),
    },
  })),
}));

describe('Sync Engine Worker', () => {
  const mockConfig: Config = {
    workspaceId: 'workspace-1',
    providerId: 'mock-provider',
    providerName: 'Internxt',
    rootPath: '/mock/path',
    loggerPath: '/mock/logs',
    rootUuid: 'mock-root-uuid',
    mnemonic: 'mock-mnemonic',
    bucket: 'mock-bucket',
    bridgeUser: 'mock-user',
    bridgePass: 'mock-pass',
    workspaceToken: 'mock-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    workers['workspace-1']?.worker?.destroy();
    delete workers['workspace-1'];
  });

  it('should start a new worker if it is not running', async () => {
    await spawnSyncEngineWorker(mockConfig);

    ipcRenderer.send('SYNC_ENGINE_PROCESS_SETUP_SUCCESSFUL', mockConfig.workspaceId);

    expect(BrowserWindow).toHaveBeenCalled();
    expect(workers['workspace-1'].worker).not.toBeNull();
    expect(workers['workspace-1'].startingWorker).toBe(false);
    expect(workers['workspace-1'].workerIsRunning).toBe(true);
  });

  it('should not start a worker if it is already running', async () => {
    workers['workspace-1'] = {
      worker: new BrowserWindow(),
      workerIsRunning: true,
      startingWorker: false,
      syncSchedule: null,
    };

    await spawnSyncEngineWorker(mockConfig);

    expect(BrowserWindow).nthCalledWith(1);
    expect(workers['workspace-1'].worker).not.toBeNull();
  });

  it('should stop and remove the worker correctly', async () => {
    await spawnSyncEngineWorker(mockConfig);
    await stopAndClearSyncEngineWatcher(mockConfig.workspaceId);

    expect(workers['workspace-1']).toBeUndefined();
  });
});
