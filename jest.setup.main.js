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

jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  
  return {
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
    create: jest.fn(() => mockAxiosInstance),
  };
});

jest.mock('@internxt/inxt-js', () => ({
  default: jest.fn(),
}));
