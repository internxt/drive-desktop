import {
  ManualSystemScan,
  getManualScanMonitorInstance,
} from './ManualSystemScan';
import { Antivirus } from './Antivirus';
import fs from 'fs';

jest.mock('./Antivirus');
jest.mock('../device/service', () => ({
  getUserSystemPath: jest.fn(() => '/home/user/Documents'),
}));
jest.mock('./utils/getFilesFromDirectory', () => ({
  getFilesFromDirectory: jest.fn((_path, callback) => {
    callback('/path/to/file.txt');
    return Promise.resolve();
  }),
  countSystemFiles: jest.fn(() => Promise.resolve(10)),
}));
jest.mock('./utils/transformItem', () => ({
  transformItem: jest.fn((path) => ({
    pathName: path,
    name: path.split('/').pop(),
    hash: 'mock-hash',
    updatedAtW: Date.now(),
    isInfected: false,
  })),
}));
jest.mock('./utils/isPermissionError', () => ({
  isPermissionError: jest.fn(() => false),
}));
jest.mock('./utils/errorUtils', () => ({
  isError: jest.fn((error) => error instanceof Error),
  getErrorMessage: jest.fn((error) => error?.message || String(error)),
  shouldRethrowError: jest.fn(() => false),
}));
jest.mock('./db/DBScannerConnection', () => ({
  DBScannerConnection: jest.fn().mockImplementation(() => ({
    getConnection: jest.fn(() => ({
      getRepository: jest.fn(() => ({
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
      })),
    })),
    getItemFromDatabase: jest.fn().mockResolvedValue(null),
    addItemToDatabase: jest.fn().mockResolvedValue(undefined),
    updateItemToDatabase: jest.fn().mockResolvedValue(undefined),
  })),
}));
jest.mock('../database/collections/ScannedItemCollection', () => ({
  ScannedItemCollection: jest.fn().mockImplementation(() => ({
    findByPath: jest.fn(),
    save: jest.fn(),
  })),
}));
jest.mock('../database/data-source', () => ({
  AppDataSource: {
    initialize: jest.fn().mockResolvedValue({
      getRepository: jest.fn(() => ({
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
      })),
    }),
  },
}));
jest.mock('async', () => ({
  queue: jest.fn((worker) => ({
    push: jest.fn((item, callback) => {
      worker(item, callback);
      return { drain: jest.fn() };
    }),
    pushAsync: jest.fn((item) => {
      return Promise.resolve(worker(item));
    }),
    drain: jest.fn().mockResolvedValue(undefined),
    kill: jest.fn(),
  })),
}));
jest.mock('../event-bus', () => ({
  __esModule: true,
  default: {
    emit: jest.fn(),
  },
}));
jest.mock('electron', () => ({
  app: {
    isPackaged: false,
    getName: jest.fn(() => 'drive-desktop-linux'),
    getPath: jest.fn(() => '/mock/path'),
    getVersion: jest.fn(() => '1.0.0'),
  },
  BrowserWindow: jest.fn(),
  ipcMain: {
    on: jest.fn(),
    handle: jest.fn(),
  },
}));
jest.mock('electron-log');
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
  basename: jest.fn((p) => p.split('/').pop()),
}));
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
  },
  existsSync: jest.fn(),
  statSync: jest.fn(),
}));

describe('ManualSystemScan', () => {
  let manualSystemScan: ManualSystemScan;
  let mockAntivirus: jest.Mocked<Antivirus>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockAntivirus = {
      scanFile: jest.fn().mockImplementation((path) => {
        return Promise.resolve({
          file: path,
          isInfected: false,
          viruses: [],
        });
      }),
      stopClamAv: jest.fn().mockResolvedValue(undefined),
      stopServer: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Antivirus>;

    (Antivirus.createInstance as jest.Mock).mockResolvedValue(mockAntivirus);

    (fs.promises.readdir as jest.Mock).mockResolvedValue([
      'file1.txt',
      'file2.txt',
    ]);
    (fs.promises.stat as jest.Mock).mockImplementation((path) => {
      return Promise.resolve({
        isDirectory: () => path.includes('dir'),
        isFile: () => !path.includes('dir'),
      });
    });
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({
      isDirectory: () => false,
      isFile: () => true,
    });

    const mockScanResult = {
      file: '/path/to/file.txt',
      isInfected: false,
      viruses: [] as [],
    };

    mockAntivirus.scanFile.mockResolvedValue(mockScanResult);

    manualSystemScan = await getManualScanMonitorInstance();
  });

  describe('scanItems', () => {
    it('should scan specified paths', async () => {
      const getFilesFromDirectory = jest.requireMock(
        './utils/getFilesFromDirectory'
      ).getFilesFromDirectory;

      await manualSystemScan.scanItems(['/path/to/file.txt']);

      expect(Antivirus.createInstance).toHaveBeenCalled();

      expect(mockAntivirus.scanFile).toHaveBeenCalledWith('/path/to/file.txt');

      expect(getFilesFromDirectory).toHaveBeenCalled();
    });
  });

  describe('stopScan', () => {
    it('should stop the scan process', async () => {
      const mockKill = jest.fn();
      (manualSystemScan as any).manualQueue = {
        kill: mockKill,
      };

      (manualSystemScan as any).antivirus = mockAntivirus;

      await manualSystemScan.stopScan();

      expect((manualSystemScan as any).cancelled).toBe(true);

      expect(mockKill).toHaveBeenCalled();

      expect(mockAntivirus.stopClamAv).toHaveBeenCalled();
    });
  });
});
