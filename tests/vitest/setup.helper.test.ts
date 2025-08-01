import { vi } from 'vitest';
import path from 'path';
import { mkdirSync } from 'fs';
import { TEST_FILES } from './mocks.helper.test';

process.env.NEW_CRYPTO_KEY = 'crypto_key';
process.env.NODE_ENV = 'development';

// We do not want to log anything
vi.mock(import('@/apps/shared/logger/logger'));
// We do not want to make network calls
vi.mock(import('@/apps/shared/HttpClient/auth-client'));
vi.mock(import('@/apps/shared/HttpClient/client'));

vi.mock('../event-bus', () => {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  return {
    default: {
      emit: vi.fn((event, ...args) => listeners[event] && listeners[event].forEach((listener) => listener(...args))),
      on: vi.fn((event, callback) => listeners[event] && listeners[event].push(callback)),
    },
  };
});

vi.mock('electron', async () => {
  const ipcMainHandlers: Record<string, (...args: unknown[]) => void> = {};
  const actual = await vi.importActual<typeof import('electron')>('electron');
  return {
    ...actual,
    app: {
      ...actual.app,
      getPath: vi.fn((string) => {
        if (string === 'home') {
          return path.join(process.cwd(), 'tests/temp-test');
        }
        return '/mock/logs';
      }),
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
        (event) =>
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
        (event) =>
          ipcMainHandlers[event] &&
          ipcMainHandlers[event]({
            sender: {
              send: vi.fn(),
            },
          }),
      ),
      invoke: vi.fn(
        (event) =>
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

vi.mock('@/apps/main/virtual-root-folder/service.ts', () => {
  return {
    getLoggersPaths: vi.fn(() => '/mock/logs'),
    getRootVirtualDrive: vi.fn(() => '/mock/path'),
    getRootWorkspace: vi.fn(() => ({
      syncRoot: '/mock/path',
    })),
  };
});

vi.mock('@/apps/main/windows/widget.ts', () => {
  return {
    getWidget: vi.fn(() => ({
      webContents: {
        send: vi.fn(),
      },
    })),
  };
});

mkdirSync(TEST_FILES, { recursive: true });
