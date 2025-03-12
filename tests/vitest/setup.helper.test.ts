import { vi } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

vi.mock('@/apps/main/auth/service', () => {
  const user = {
    email: 'jonathandanielarce9@gmail.com',
    userId: '$2a$08$qagrvGIzPiL0Qm2/zSqEf.RwaHuGbYcEcooch.RDhZm/NkH7pOdna',
    mnemonic:
      'strategy thought bleak mouse water couch dinosaur orchard syrup into toilet dice squirrel hotel mass wasp camp enhance prevent avocado foam purse cotton royal',
    root_folder_id: 76977090,
    rootFolderId: '928cddab-db8d-4393-8887-22af95bf36df',
    name: 'My',
    lastname: 'Internxt',
    uuid: '53630301-0faa-4b41-816e-600bac2b2aa5',
    credit: 0,
    createdAt: '2024-02-29T13:40:15.000Z',
    privateKey: 'privateKey',
    publicKey: 'publicKey',
    revocateKey: 'revocateKey',
    keys: {
      ecc: {
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      },
      kyber: {
        publicKey: 'publicKey',
        privateKey: 'privateKey',
      },
    },
    bucket: '6fe364ed7c9a3022c1c8decd',
    registerCompleted: true,
    teams: false,
    username: 'jonathandanielarce9@gmail.com',
    bridgeUser: 'jonathandanielarce9@gmail.com',
    sharedWorkspace: false,
    appSumoDetails: null,
    hasReferralsProgram: false,
    backupsBucket: '7642d392264c616acbe62ace',
    avatar: null,
    emailVerified: true,
    lastPasswordChangedAt: '2025-02-17T14:48:24.000Z',
  };

  return {
    getUser: vi.fn(() => user),
  };
});

vi.mock('../event-bus', () => {
  const listeners: Record<string, ((...args: any[]) => void)[]> = {};

  return {
    default: {
      emit: vi.fn((event, ...args) => listeners[event] && listeners[event].forEach((listener) => listener(...args))),
      on: vi.fn((event, callback) => listeners[event] && listeners[event].push(callback)),
    },
  };
});

vi.mock('@apps/main/analytics/rudderstack-client', () => {
  return {
    client: {
      identify: vi.fn().mockReturnValue(Promise.resolve()),
      track: vi.fn().mockReturnValue(Promise.resolve()),
      page: vi.fn().mockReturnValue(Promise.resolve()),
      alias: vi.fn().mockReturnValue(Promise.resolve()),
      group: vi.fn().mockReturnValue(Promise.resolve()),
      flush: vi.fn().mockReturnValue(Promise.resolve()),
    },
  };
});

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
