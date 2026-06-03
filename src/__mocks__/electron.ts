/**
 * Electron stub used during unit tests (vitest.config.main.ts resolve alias).
 * Aliased at the resolver level so electron/index.js never runs its binary check.
 */
import { vi } from 'vitest';

const app = {
  getPath: vi.fn().mockReturnValue('/mock/home'),
  getName: vi.fn().mockReturnValue('DriveDesktop'),
  getVersion: vi.fn().mockReturnValue('1.0.0'),
  quit: vi.fn(),
  on: vi.fn(),
};

const ipcMain = {
  on: vi.fn(),
  handle: vi.fn(),
};

const ipcRenderer = {
  on: vi.fn(),
  send: vi.fn(),
  invoke: vi.fn(),
};

const dialog = {
  showOpenDialog: vi.fn(),
};

const BrowserWindow = {
  getFocusedWindow: vi.fn(),
  getAllWindows: vi.fn(),
};

const safeStorage = {
  isEncryptionAvailable: vi.fn(),
  decryptString: vi.fn(),
  encryptString: vi.fn(),
};

const nativeImage = {
  createFromBuffer: vi.fn().mockReturnValue({
    isEmpty: () => false,
    getSize: () => ({ width: 100, height: 100 }),
    resize: vi.fn().mockReturnValue({ toPNG: () => Buffer.from('png') }),
  }),
};

const shell = {
  openPath: vi.fn(),
  openExternal: vi.fn(),
};

export { app, ipcMain, ipcRenderer, dialog, BrowserWindow, safeStorage, nativeImage, shell };
