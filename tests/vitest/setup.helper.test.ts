import path from 'node:path/posix';
import { mkdirSync } from 'node:fs';
import { TEST_FILES } from './mocks.helper.test';

process.env.NEW_CRYPTO_KEY = 'crypto_key';
process.env.NODE_ENV = 'development';

// We do not want to log anything
vi.mock(import('@internxt/drive-desktop-core/build/backend'));
// We do not want to make network calls
vi.mock(import('@/apps/shared/HttpClient/auth-client'));
vi.mock(import('@/apps/shared/HttpClient/client'));

vi.mock(import('electron'), () => {
  const actual = vi.importActual<typeof import('electron')>('electron');

  return {
    ...actual,
    app: {
      getPath: vi.fn((string) => {
        if (string === 'home') {
          return path.join(TEST_FILES, 'setup-root-folder');
        }
        return '/mock/logs';
      }),
      on: vi.fn(),
    },
    shell: {
      openPath: vi.fn(),
      openExternal: vi.fn(),
    },
    ipcMain: {
      on: vi.fn(),
      emit: vi.fn(),
      handle: vi.fn(),
      invoke: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadFile: vi.fn(),
      webContents: {
        send: vi.fn(),
        on: vi.fn(),
      },
      destroy: vi.fn(),
      isDestroyed: vi.fn(),
    })),
    Notification: vi.fn(),
    ipcRenderer: {
      on: vi.fn(),
      send: vi.fn(),
      handle: vi.fn(),
      invoke: vi.fn(),
    },
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
