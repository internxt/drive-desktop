import { mkdirSync } from 'node:fs';
import { cwd } from 'node:process';
import { abs, join } from '@/context/local/localFile/infrastructure/AbsolutePath';

const TEST_FILES = join(abs(cwd()), 'test-files');

process.env.NEW_CRYPTO_KEY = 'crypto_key';
process.env.NODE_ENV = 'test';

// We do not want to make network calls
vi.mock(import('@/apps/shared/HttpClient/client'));
// We don't want sentry in tests
vi.mock(import('@internxt/drive-desktop-core/build/backend/core/sentry/sentry'), () => ({}));

function mockModule() {
  const fns = new Map<string, ReturnType<typeof vi.fn>>();
  return new Proxy({} as Record<string, ReturnType<typeof vi.fn>>, {
    get(_, prop) {
      if (typeof prop === 'string') {
        if (!fns.has(prop)) fns.set(prop, vi.fn());
        return fns.get(prop);
      }
      return undefined;
    },
    set(_, prop, value) {
      if (typeof prop === 'string') fns.set(prop, value);
      return true;
    },
    has(_, prop) {
      return typeof prop === 'string';
    },
    getOwnPropertyDescriptor(_, prop) {
      if (typeof prop === 'string' && fns.has(prop)) {
        return { configurable: true, enumerable: true, writable: true, value: fns.get(prop) };
      }
      if (typeof prop === 'string') {
        const fn = vi.fn();
        fns.set(prop, fn);
        return { configurable: true, enumerable: true, writable: true, value: fn };
      }
      return undefined;
    },
    defineProperty(_, prop, desc) {
      if (typeof prop === 'string' && desc.value) {
        fns.set(prop, desc.value);
        return true;
      }
      return false;
    },
  });
}

// @ts-expect-error needed because of sentry
vi.mock(import('@internxt/drive-desktop-core/build/backend'), () => {
  return {
    logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn(), sentryError: vi.fn() },
    setupElectronLog: vi.fn(),
    throwWrapper: vi.fn(),
    FileSystemModule: mockModule(),
    PaymentsModule: mockModule(),
    CleanerModule: mockModule(),
    SyncModule: mockModule(),
  };
});

// @ts-expect-error we cannot do importActual('electron') and use it inside the mock because sometimes it throws
// Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
vi.mock(import('electron'), () => {
  return {
    app: {
      getPath: vi.fn((string) => {
        return join(TEST_FILES, string);
      }),
      on: vi.fn(),
    },
    nativeImage: {
      createFromPath: vi.fn(),
      createThumbnailFromPath: vi.fn(),
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
