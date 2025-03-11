import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserWindow, ipcMain, ipcRenderer } from 'electron';
import { Config } from '@/apps/sync-engine/config';
import { spawnSyncEngineWorker, stopAndClearSyncEngineWatcher, workers } from '@/apps/main/background-processes/sync-engine';
import { mockDeep } from 'vitest-mock-extended';

vi.mock('@/apps/main/virtual-root-folder/service.ts', () => {
  return {
    getLoggersPaths: vi.fn(() => '/mock/logs'),
    getRootVirtualDrive: vi.fn(() => '/mock/path'),
    getRootWorkspace: vi.fn(() => ({
      logEnginePath: '/mock/logs',
      logWatcherPath: '/mock/logs',
      persistQueueManagerPath: '/mock/logs',
      syncRoot: '/mock/path',
      lastSavedListing: '/mock/logs',
    })),
  };
});

vi.mock('electron', async () => {
  const actual = await vi.importActual<typeof import('electron')>('electron');
  return {
    ...actual,
    app: {
      ...actual.app,
      getPath: vi.fn(() => '/mock/path'),
      on: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadFile: vi.fn(),
      webContents: {
        send: vi.fn(),
        on: vi.fn(),
        getOSProcessId: vi.fn().mockReturnValue(1234),
      },
      destroy: vi.fn(),
      isDestroyed: vi.fn().mockReturnValue(false),
    })),
    ipcRenderer: {
      on: vi.fn(),
      send: vi.fn(),
      handle: vi.fn(),
      invoke: vi.fn(),
    },
  };
});

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
    vi.mock('electron', async () => {
      const ipcMainHandlers: Record<string, (...args: any[]) => void> = {};
      const actual = await vi.importActual<typeof import('electron')>('electron');
      return {
        ...actual,
        app: {
          ...actual.app,
          getPath: vi.fn(() => '/mock/path'),
          on: vi.fn(),
        },
        ipcMain: {
          on: vi.fn((event, callback) => {
            ipcMainHandlers[event] = callback;
          }),
          emit: vi.fn((event, ...args) => ipcMainHandlers[event] && ipcMainHandlers[event](...args)),
          handle: vi.fn((event, callback) => {
            ipcMainHandlers[event] = callback;
          }),
          invoke: vi.fn((event, ...args) => ipcMainHandlers[event] && ipcMainHandlers[event](...args)),
        },
        BrowserWindow: vi.fn().mockImplementation(() => ({
          loadFile: vi.fn(),
          webContents: {
            send: vi.fn(),
            on: vi.fn(),
            getOSProcessId: vi.fn().mockReturnValue(1234),
          },
          destroy: vi.fn(),
          isDestroyed: vi.fn().mockReturnValue(false),
        })),
        ipcRenderer: {
          on: vi.fn(
            (event, callback) =>
              ipcMainHandlers[event] &&
              ipcMainHandlers[event]({
                sender: {
                  send: vi.fn(),
                },
              }),
          ),
          send: vi.fn(
            (event, ...args) =>
              ipcMainHandlers[event] &&
              ipcMainHandlers[event](
                {
                  sender: {
                    send: vi.fn(),
                  },
                },
                ...args,
              ),
          ),
          handle: vi.fn(
            (event, callback) =>
              ipcMainHandlers[event] &&
              ipcMainHandlers[event]({
                sender: {
                  send: vi.fn(),
                },
              }),
          ),
          invoke: vi.fn(
            (event, ...args) =>
              ipcMainHandlers[event] &&
              ipcMainHandlers[event]({
                sender: {
                  send: vi.fn(),
                },
              }),
          ),
        },
      };
    });
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
  }, 15000);
});
