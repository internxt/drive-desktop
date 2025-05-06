/* eslint-env jest */

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn().mockReturnValue('/mock/home'),
    getName: jest.fn().mockReturnValue('DriveDesktop'),
    getVersion: jest.fn().mockReturnValue('1.0.0'),
  },
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn()
  },
}));

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  }));
});
