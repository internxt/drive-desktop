import {
  ManualSystemScan,
  getManualScanMonitorInstance,
  ProgressData,
} from './ManualSystemScan';
import { Antivirus } from './Antivirus';
import { ScannedItem } from '../database/entities/ScannedItem';
import fs from 'fs';
import eventBus from '../event-bus';

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
    isInitialized: true,
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
jest.mock('@internxt/drive-desktop-core/build/backend', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
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
      scanFileWithRetry: jest.fn().mockImplementation((path) => {
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
    mockAntivirus.scanFileWithRetry.mockResolvedValue(mockScanResult);

    manualSystemScan = await getManualScanMonitorInstance();
  });

  describe('scanItems', () => {
    jest.setTimeout(15000);

    it('should scan specified paths', async () => {
      const getFilesFromDirectory = jest.requireMock(
        './utils/getFilesFromDirectory'
      ).getFilesFromDirectory;

      const originalResetCounters = manualSystemScan['resetCounters'];
      manualSystemScan['resetCounters'] = jest
        .fn()
        .mockResolvedValue(undefined);

      const mockQueue = {
        pushAsync: jest.fn().mockResolvedValue(undefined),
        drain: jest.fn().mockResolvedValue(undefined),
        kill: jest.fn(),
      };
      (manualSystemScan as any).manualQueue = mockQueue;

      const originalWaitForActiveScans = manualSystemScan['waitForActiveScans'];
      manualSystemScan['waitForActiveScans'] = jest
        .fn()
        .mockResolvedValue(undefined);

      await manualSystemScan.scanItems(['/path/to/file.txt']);

      expect(Antivirus.createInstance).toHaveBeenCalled();

      expect(getFilesFromDirectory).toHaveBeenCalled();

      manualSystemScan['resetCounters'] = originalResetCounters;
      manualSystemScan['waitForActiveScans'] = originalWaitForActiveScans;
    });
  });

  describe('stopScan', () => {
    it('should stop the scan process', async () => {
      const mockKill = jest.fn();
      (manualSystemScan as any).manualQueue = {
        kill: mockKill,
      };

      (manualSystemScan as any).antivirus = mockAntivirus;

      const originalResetCounters = manualSystemScan['resetCounters'];
      manualSystemScan['resetCounters'] = jest
        .fn()
        .mockResolvedValue(undefined);

      await manualSystemScan.stopScan();

      expect((manualSystemScan as any).cancelled).toBe(true);

      expect(mockKill).toHaveBeenCalled();

      expect(mockAntivirus.stopClamAv).toHaveBeenCalled();

      manualSystemScan['resetCounters'] = originalResetCounters;
    });
  });

  describe('emitProgressEvent', () => {
    it('should emit a progress event with provided data', () => {
      const progressData: Partial<ProgressData> = {
        currentScanPath: '/test/path',
        progress: 50,
        infectedFiles: ['/infected/file.txt'],
        totalScannedFiles: 5,
      };

      const result = manualSystemScan['emitProgressEvent'](progressData, 123);

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({
          currentScanPath: '/test/path',
          progress: 50,
          infectedFiles: ['/infected/file.txt'],
          totalScannedFiles: 5,
          scanId: 'scan-123',
          done: false,
        })
      );

      expect(result).toMatchObject({
        currentScanPath: '/test/path',
        progress: 50,
        infectedFiles: ['/infected/file.txt'],
        totalScannedFiles: 5,
        scanId: 'scan-123',
        done: false,
      });
    });

    it('should use default values when not provided', () => {
      (manualSystemScan as any).infectedFiles = ['/test/infected.txt'];
      (manualSystemScan as any).totalScannedFiles = 10;

      const calculateProgressSpy = jest.spyOn(
        manualSystemScan as any,
        'calculateProgress'
      );
      calculateProgressSpy.mockReturnValue(75);

      const result = manualSystemScan['emitProgressEvent']({});

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({
          currentScanPath: 'Scanning...',
          progress: 75,
          infectedFiles: ['/test/infected.txt'],
          totalScannedFiles: 10,
        })
      );

      calculateProgressSpy.mockRestore();
    });

    it('should not emit event immediately when emitNow is false', () => {
      (manualSystemScan as any).progressEvents = [];

      const progressData: Partial<ProgressData> = {
        currentScanPath: '/test/path',
      };

      manualSystemScan['emitProgressEvent'](progressData, 123, false);

      expect(eventBus.emit).not.toHaveBeenCalled();

      expect((manualSystemScan as any).progressEvents.length).toBeGreaterThan(
        0
      );
      expect((manualSystemScan as any).progressEvents[0]).toMatchObject({
        currentScanPath: '/test/path',
      });
    });
  });

  describe('calculateProgress', () => {
    it('should return 50 when totalItemsToScan is 0', () => {
      (manualSystemScan as any).totalItemsToScan = 0;

      const progress = manualSystemScan['calculateProgress']();

      expect(progress).toBe(50);
    });

    it('should return 100 when totalScannedFiles >= totalItemsToScan', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 100;

      const progress = manualSystemScan['calculateProgress']();

      expect(progress).toBe(100);
    });

    it('should calculate percentage correctly', () => {
      (manualSystemScan as any).totalItemsToScan = 200;
      (manualSystemScan as any).totalScannedFiles = 50;

      const progress = manualSystemScan['calculateProgress']();

      expect(progress).toBe(24);
    });

    it('should cap progress at 99% until complete', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 99;

      const progress = manualSystemScan['calculateProgress']();

      expect(progress).toBe(98);
    });
  });

  describe('emitCompletionEvent', () => {
    it('should emit a completion event with the specified message', () => {
      (manualSystemScan as any).infectedFiles = ['/infected.txt'];
      (manualSystemScan as any).totalScannedFiles = 100;

      manualSystemScan['emitCompletionEvent'](
        'Test Complete',
        0,
        'test-session'
      );

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({
          currentScanPath: 'Test Complete',
          infectedFiles: ['/infected.txt'],
          progress: 100,
          totalScannedFiles: 100,
          done: true,
          scanId: 'test-session',
        })
      );
    });

    it('should emit a delayed event when delay > 0', () => {
      jest.useFakeTimers();

      manualSystemScan['emitCompletionEvent']('Delayed Complete', 1000);

      expect(eventBus.emit).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);

      expect(eventBus.emit).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('emitErrorEvent', () => {
    it('should emit an error event with the specified message', () => {
      (manualSystemScan as any).infectedFiles = [];
      (manualSystemScan as any).totalScannedFiles = 50;

      manualSystemScan['emitErrorEvent']('Test Error', 'error-session');

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({
          currentScanPath: 'Test Error',
          infectedFiles: [],
          progress: 100,
          totalScannedFiles: 50,
          done: true,
          scanId: 'error-session',
        })
      );
    });
  });

  describe('trackProgress', () => {
    beforeEach(() => {
      (manualSystemScan as any).scanSessionId = 1;
      (manualSystemScan as any).totalScannedFiles = 0;
      (manualSystemScan as any).infectedFiles = [];
      (manualSystemScan as any).totalInfectedFiles = 0;
      (manualSystemScan as any).totalItemsToScan = 10;

      jest.spyOn(manualSystemScan as any, 'emitProgressEvent').mockReturnValue({
        currentScanPath: 'test',
        progress: 10,
        done: false,
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should track progress for non-infected files', () => {
      manualSystemScan.trackProgress(1, {
        file: '/test/clean.txt',
        isInfected: false,
      });

      expect((manualSystemScan as any).totalScannedFiles).toBe(1);
      expect((manualSystemScan as any).totalInfectedFiles).toBe(0);
      expect((manualSystemScan as any).infectedFiles).toEqual([]);

      expect((manualSystemScan as any).emitProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          currentScanPath: '/test/clean.txt',
          scanId: 'scan-1',
        }),
        1,
        false
      );
    });

    it('should track progress for infected files and emit immediately', () => {
      manualSystemScan.trackProgress(1, {
        file: '/test/infected.txt',
        isInfected: true,
      });

      expect((manualSystemScan as any).totalScannedFiles).toBe(1);
      expect((manualSystemScan as any).totalInfectedFiles).toBe(1);
      expect((manualSystemScan as any).infectedFiles).toEqual([
        '/test/infected.txt',
      ]);

      expect((manualSystemScan as any).emitProgressEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          currentScanPath: '/test/infected.txt',
          scanId: 'scan-1',
        }),
        1,
        true
      );
    });

    it('should not update tracking for different session ID', () => {
      manualSystemScan.trackProgress(999, {
        file: '/test/file.txt',
        isInfected: true,
      });

      expect((manualSystemScan as any).totalScannedFiles).toBe(0);
      expect((manualSystemScan as any).totalInfectedFiles).toBe(0);
      expect((manualSystemScan as any).infectedFiles).toEqual([]);
      expect(
        (manualSystemScan as any).emitProgressEvent
      ).not.toHaveBeenCalled();
    });

    it('should handle completion when 100% is reached', () => {
      (manualSystemScan as any).totalScannedFiles = 9;
      (manualSystemScan as any).totalItemsToScan = 10;

      jest
        .spyOn(manualSystemScan as any, 'calculateProgress')
        .mockReturnValue(100);

      (manualSystemScan as any).emitProgressEvent.mockReturnValue({
        done: false,
        currentScanPath: '/test/last.txt',
      });

      jest.useFakeTimers();

      manualSystemScan.trackProgress(1, {
        file: '/test/last.txt',
        isInfected: false,
      });

      expect(
        (manualSystemScan as any).emitProgressEvent.mock.results[0].value.done
      ).toBe(true);

      jest.advanceTimersByTime(1000);
      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({ done: true })
      );

      jest.useRealTimers();
      (manualSystemScan as any).calculateProgress.mockRestore();
    });
  });

  describe('clearAntivirus', () => {
    it('should stop ClamAV and clear the antivirus instance', async () => {
      (manualSystemScan as any).antivirus = mockAntivirus;

      await manualSystemScan['clearAntivirus']();

      expect(mockAntivirus.stopClamAv).toHaveBeenCalled();
      expect((manualSystemScan as any).antivirus).toBeNull();
    });

    it('should handle errors when stopping ClamAV', async () => {
      (manualSystemScan as any).antivirus = mockAntivirus;

      mockAntivirus.stopClamAv.mockRejectedValueOnce(new Error('Test error'));

      await manualSystemScan['clearAntivirus']();

      expect((manualSystemScan as any).antivirus).toBeNull();
    });

    it('should do nothing if no antivirus instance exists', async () => {
      (manualSystemScan as any).antivirus = null;

      await manualSystemScan['clearAntivirus']();

      expect(mockAntivirus.stopClamAv).not.toHaveBeenCalled();
      expect((manualSystemScan as any).antivirus).toBeNull();
    });
  });

  describe('resetCounters', () => {
    it('should reset all counters and state', async () => {
      (manualSystemScan as any).totalScannedFiles = 100;
      (manualSystemScan as any).totalInfectedFiles = 5;
      (manualSystemScan as any).infectedFiles = ['/test.txt'];
      (manualSystemScan as any).progressEvents = [{ progress: 50 }];
      (manualSystemScan as any).totalItemsToScan = 200;
      (manualSystemScan as any).errorCount = 10;
      (manualSystemScan as any).cancelled = true;

      const mockQueue = { kill: jest.fn() };
      (manualSystemScan as any).manualQueue = mockQueue;

      (manualSystemScan as any).antivirus = mockAntivirus;

      jest
        .spyOn(manualSystemScan as any, 'clearAllIntervals')
        .mockImplementation(() => {
          /* mock implementation */
        });

      await manualSystemScan['resetCounters']();

      expect((manualSystemScan as any).totalScannedFiles).toBe(0);
      expect((manualSystemScan as any).totalInfectedFiles).toBe(0);
      expect((manualSystemScan as any).infectedFiles).toEqual([]);
      expect((manualSystemScan as any).progressEvents).toEqual([]);
      expect((manualSystemScan as any).totalItemsToScan).toBe(0);
      expect((manualSystemScan as any).errorCount).toBe(0);
      expect((manualSystemScan as any).cancelled).toBe(false);

      expect((manualSystemScan as any).clearAllIntervals).toHaveBeenCalled();
      expect(mockQueue.kill).toHaveBeenCalled();
      expect(mockAntivirus.stopClamAv).toHaveBeenCalled();

      (manualSystemScan as any).clearAllIntervals.mockRestore();
    });
  });

  describe('emitEmptyDirProgressEvent', () => {
    it('should emit a progress event for an empty directory', () => {
      jest
        .spyOn(manualSystemScan as any, 'emitProgressEvent')
        .mockImplementation(() => ({}));

      manualSystemScan['emitEmptyDirProgressEvent']('/empty/dir', 123);

      expect((manualSystemScan as any).emitProgressEvent).toHaveBeenCalledWith(
        {
          currentScanPath: '/empty/dir',
          progress: 100,
          totalScannedFiles: 0,
          done: true,
          scanId: 'scan-empty-123',
        },
        123
      );

      (manualSystemScan as any).emitProgressEvent.mockRestore();
    });
  });

  describe('isScanComplete and isNearlyScanComplete', () => {
    it('isScanComplete should return true when all files are scanned', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 100;

      expect(manualSystemScan['isScanComplete']()).toBe(true);
    });

    it('isScanComplete should return false when not all files are scanned', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 90;

      expect(manualSystemScan['isScanComplete']()).toBe(false);
    });

    it('isNearlyScanComplete should return true when 99.5% of files are processed', () => {
      (manualSystemScan as any).totalItemsToScan = 1000;
      (manualSystemScan as any).totalScannedFiles = 995;
      (manualSystemScan as any).errorCount = 0;

      expect(manualSystemScan['isNearlyScanComplete']()).toBe(true);
    });

    it('isNearlyScanComplete should return true when only a few files remain', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 96;
      (manualSystemScan as any).errorCount = 0;

      expect(manualSystemScan['isNearlyScanComplete']()).toBe(true);
    });

    it('isNearlyScanComplete should count errors toward completion', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 90;
      (manualSystemScan as any).errorCount = 8;

      expect(manualSystemScan['isNearlyScanComplete']()).toBe(true);
    });
  });

  describe('handleStalledScan', () => {
    it('should increment stuck count when no progress', () => {
      (manualSystemScan as any).totalScannedFiles = 5;

      const result = manualSystemScan['handleStalledScan'](
        5,
        1,
        0,
        false,
        false,
        true
      );

      expect(result).toEqual({
        stuckCount: 1,
        hasError: false,
        isComplete: false,
        shouldContinue: true,
      });
    });

    it('should force completion if nearly complete and stuck for a while', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 98;
      (manualSystemScan as any).errorCount = 1;

      jest
        .spyOn(manualSystemScan as any, 'isNearlyScanComplete')
        .mockReturnValue(true);

      const result = manualSystemScan['handleStalledScan'](
        98,
        1,
        30,
        false,
        false,
        false
      );

      expect(result.isComplete).toBe(true);
      expect(result.shouldContinue).toBe(false);

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({ done: true })
      );

      (manualSystemScan as any).isNearlyScanComplete.mockRestore();
    });

    it('should report error if custom scan is stuck and not nearly complete', () => {
      (manualSystemScan as any).totalItemsToScan = 100;
      (manualSystemScan as any).totalScannedFiles = 50;

      jest
        .spyOn(manualSystemScan as any, 'isNearlyScanComplete')
        .mockReturnValue(false);

      const result = manualSystemScan['handleStalledScan'](
        50,
        1,
        30,
        false,
        false,
        true
      );

      expect(result.hasError).toBe(true);
      expect((manualSystemScan as any).cancelled).toBe(true);

      expect(eventBus.emit).toHaveBeenCalledWith(
        'ANTIVIRUS_SCAN_PROGRESS',
        expect.objectContaining({
          currentScanPath: expect.stringContaining('Scan appears stuck'),
          done: true,
        })
      );

      (manualSystemScan as any).isNearlyScanComplete.mockRestore();
    });

    it('should reset stuck count if progress is made', () => {
      const result = manualSystemScan['handleStalledScan'](
        4,
        1,
        3,
        false,
        false,
        true
      );

      expect(result.stuckCount).toBe(0);
      expect(result.shouldContinue).toBe(true);
    });
  });

  describe('handlePreviousScannedItem', () => {
    it('should track progress for matching item', async () => {
      const currentSession = 1;
      const mockScannedItem: Partial<ScannedItem> = {
        pathName: '/test/file.txt',
        hash: 'abc123',
        updatedAtW: '12345',
        isInfected: false,
      };

      const mockPreviousItem: Partial<ScannedItem> = {
        pathName: '/test/file.txt',
        hash: 'abc123',
        updatedAtW: '12345',
        isInfected: false,
      };

      const trackProgressSpy = jest
        .spyOn(manualSystemScan, 'trackProgress')
        .mockImplementation(() => {
          /* mock implementation */
        });

      await manualSystemScan['handlePreviousScannedItem'](
        currentSession,
        mockScannedItem as ScannedItem,
        mockPreviousItem as ScannedItem
      );

      expect(trackProgressSpy).toHaveBeenCalledWith(currentSession, {
        file: '/test/file.txt',
        isInfected: false,
      });

      trackProgressSpy.mockRestore();
    });

    it('should not track progress if session IDs differ', async () => {
      const currentSession = 1;
      const wrongSession = 2;

      const trackProgressSpy = jest
        .spyOn(manualSystemScan, 'trackProgress')
        .mockImplementation(() => {
          /* mock implementation */
        });

      await manualSystemScan['handlePreviousScannedItem'](
        wrongSession,
        {
          pathName: '',
          hash: '',
          updatedAtW: '',
          isInfected: false,
        } as ScannedItem,
        {
          pathName: '',
          hash: '',
          updatedAtW: '',
          isInfected: false,
        } as ScannedItem
      );

      expect(trackProgressSpy).not.toHaveBeenCalled();

      trackProgressSpy.mockRestore();
    });

    it('should not track progress if hashes differ', async () => {
      const currentSession = 1;
      const mockScannedItem: Partial<ScannedItem> = {
        pathName: '/test/file.txt',
        hash: 'abc123',
        updatedAtW: '12345',
        isInfected: false,
      };

      const mockPreviousItem: Partial<ScannedItem> = {
        pathName: '/test/file.txt',
        hash: 'def456',
        updatedAtW: '9999',
        isInfected: false,
      };

      const trackProgressSpy = jest
        .spyOn(manualSystemScan, 'trackProgress')
        .mockImplementation(() => {
          /* mock implementation */
        });

      await manualSystemScan['handlePreviousScannedItem'](
        currentSession,
        mockScannedItem as ScannedItem,
        mockPreviousItem as ScannedItem
      );

      expect(trackProgressSpy).not.toHaveBeenCalled();

      trackProgressSpy.mockRestore();
    });
  });
});
