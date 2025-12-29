import { mkdirSync } from 'node:fs';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { cwd } from 'node:process';

const TEST_FILES = join(abs(cwd()), 'test-files');

process.env.NEW_CRYPTO_KEY = 'crypto_key';
process.env.NODE_ENV = 'test';

// We do not want to log anything
vi.mock(import('@internxt/drive-desktop-core/build/backend'));
// We do not want to make network calls
vi.mock(import('@/apps/shared/HttpClient/client'));

vi.mock(import('electron'), () => {
  const actual = vi.importActual<typeof import('electron')>('electron');

  return {
    ...actual,
    app: {
      getPath: vi.fn((string) => {
        return join(TEST_FILES, string);
      }),
      on: vi.fn(),
    },
    nativeImage: {
      createFromPath: vi.fn(),
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
      removeListener: vi.fn(),
      removeAllListeners: vi.fn(),
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
