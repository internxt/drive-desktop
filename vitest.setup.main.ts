import 'reflect-metadata';
import { vi } from 'vitest';

// CRITICAL: Mock electron FIRST before anything else can import it
vi.mock('electron', () => ({
  app: {
    getPath: vi.fn().mockReturnValue('/mock/home'),
    getName: vi.fn().mockReturnValue('DriveDesktop'),
    getVersion: vi.fn().mockReturnValue('1.0.0'),
  },
  ipcMain: {
    on: vi.fn(),
    handle: vi.fn()
  },
}));

// Mock electron-log (depends on electron)
vi.mock('electron-log', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    transports: {
      file: { level: 'info' },
      console: { level: 'info' },
    },
  },
}));

// Mock the specific setup-electron-log module that's causing issues
vi.mock('@internxt/drive-desktop-core/src/backend/core/logger/setup-electron-log', () => ({}));

// Mock @internxt/drive-desktop-core backend to prevent it from loading electron
vi.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@internxt/drive-desktop-core/src/backend', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock native modules that require system libraries
vi.mock('@gcas/fuse', () => ({
  default: vi.fn(),
  Fuse: vi.fn().mockImplementation(() => ({
    mount: vi.fn(),
    unmount: vi.fn(),
    ops: {},
  })),
}));

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
      clear: vi.fn(),
    })),
  };
});

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: vi.fn(),
      },
      response: {
        use: vi.fn(),
      },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
    create: vi.fn(() => mockAxiosInstance),
  };
});

// Mock @internxt/inxt-js
vi.mock('@internxt/inxt-js', () => ({
  default: vi.fn(),
}));
