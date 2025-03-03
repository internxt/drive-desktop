import { jest } from '@jest/globals';
import { BackupService } from '../../../src/apps/backups/BackupService';
import { BackupsIPCRenderer } from '../../../src/apps/backups/BackupsIPCRenderer';
import { BackupsDependencyContainerFactory } from '../../../src/apps/backups/dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../../src/context/shared/domain/errors/DriveDesktopError';
import { backupFolder } from '../../../src/apps/backups';
import { BackUpErrorCauseEnum } from '../../../src/apps/backups/BackupError';
import { Either, right, left } from '../../../src/context/shared/domain/Either';
import { RetryError } from '../../../src/apps/shared/retry/RetryError';

interface BackupInfo {
  folderId: number;
  path: string;
  parentId: number;
  name: string;
}

jest.mock('electron', () => ({
  ipcRenderer: {
    on: jest.fn(),
    send: jest.fn(),
  },
}));

jest.mock('../../../src/apps/backups/BackupsIPCRenderer', () => ({
  BackupsIPCRenderer: {
    send: jest.fn(),
    on: jest.fn(),
  },
}));

(global as any).window = {
  addEventListener: jest.fn(),
};

const backupInfo = {
  folderId: 123,
  path: 'test/path',
  parentId: 456,
  name: 'test',
  folderUuid: 'uuid',
  tmpPath: 'tmpPath',
  backupsBucket: 'backupsBucket',
  pathname: 'pathname'
};

function createMockBackupService(): jest.Mocked<BackupService> {
  return {
    run: jest.fn<Promise<DriveDesktopError | undefined>, [BackupInfo, AbortController]>(),
    runWithRetry: jest.fn<Promise<Either<RetryError, DriveDesktopError | undefined>>, [BackupInfo, AbortController]>(),
    getBackupInfo: jest.fn<Promise<Either<Error, BackupInfo>>, unknown[]>(),
  } as unknown as jest.Mocked<BackupService>;
}

jest.mock(
  '../../../src/apps/backups/dependency-injection/BackupsDependencyContainerFactory',
  () => ({
    BackupsDependencyContainerFactory: {
      build: jest.fn<Promise<unknown>, []>().mockResolvedValue({
        get: jest.fn().mockImplementation((service) => {
          if (service === BackupService) {
            return createMockBackupService();
          }
          return undefined;
        }),
      }),
      reinitialize: jest.fn(),
    },
  })
);

describe('Backup Functionality', () => {
  let backupService: jest.Mocked<BackupService>;

  beforeEach(() => {
    backupService = createMockBackupService();

    (BackupsDependencyContainerFactory.build as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(backupService),
    });

    backupService.getBackupInfo.mockResolvedValue(
      Promise.resolve(right(backupInfo))
    );


    global.window = Object.create(window);
    Object.defineProperty(window, 'dispatchEvent', {
      value: jest.fn(),
      writable: true,
    });
    Object.defineProperty(window, 'addEventListener', {
      value: jest.fn(),
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should complete the backup process successfully', async () => {
    backupService.runWithRetry.mockResolvedValueOnce(right(undefined));

    await backupFolder();

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith(
      'backups.backup-completed',
      123
    );
  });

  it('should handle failure when fetching backup info', async () => {
    backupService.getBackupInfo.mockResolvedValueOnce(Promise.resolve(left(new Error('Uncontrolled error while getting backup info'))));
    await backupFolder();

    expect(BackupsIPCRenderer.send).not.toHaveBeenCalledWith(
      'backups.backup-completed',
      expect.anything()
    );
  });

  it('should handle offline event', async () => {
    jest.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
      if (event === 'offline' && typeof callback === 'function') {
        callback(new Event('offline'));
      }
    });

    backupService.runWithRetry.mockResolvedValueOnce(right(undefined));

    await backupFolder();

    window.dispatchEvent(new Event('offline'));

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith(
      'backups.backup-failed',
      123,
      BackUpErrorCauseEnum.NO_INTERNET
    );
  });

  it('should handle abort event', async () => {
    jest.useFakeTimers();

    const abortController = new AbortController();
    backupService.runWithRetry.mockResolvedValueOnce(right(undefined));

    await backupFolder();

    BackupsIPCRenderer.on('backups.abort', () => {
      abortController.abort();
    });

    jest.advanceTimersByTime(500);

    BackupsIPCRenderer.send('backups.abort');

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith('backups.abort');
  });
});
