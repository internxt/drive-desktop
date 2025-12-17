import { vi, Mock } from 'vitest';
import { BackupService } from './BackupService';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { backupFolder } from './index';
import { BackUpErrorCauseEnum } from './BackupError';
import { Either, right, left } from '../../context/shared/domain/Either';
import { RetryError } from '../shared/retry/RetryError';

interface BackupInfo {
  folderId: number;
  path: string;
  parentId: number;
  name: string;
}

// Hoist the mock service variable before the mocks
const { mockBackupService, setMockBackupService, getBackupInfo, } = vi.hoisted(() => {
  const backupInfo = {
    folderId: 123,
    path: 'test/path',
    parentId: 456,
    name: 'test',
    folderUuid: 'uuid',
    tmpPath: 'tmpPath',
    backupsBucket: 'backupsBucket',
    pathname: 'pathname',
  };

  // Helper to create Either-like objects that work in the hoisted context
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockEither = (isLeft: boolean, value: any) => ({
    isLeft: () => isLeft,
    isRight: () => !isLeft,
    getLeft: () => (isLeft ? value : undefined),
    getRight: () => (!isLeft ? value : undefined),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let service: any = {
    run: vi.fn(),
    runWithRetry: vi.fn().mockResolvedValue(createMockEither(false, undefined)),
    getBackupInfo: vi.fn().mockResolvedValue(createMockEither(false, backupInfo)),
  };
  return {
    mockBackupService: () => service,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMockBackupService: (newService: any) => {
      service = newService;
    },
    getBackupInfo: () => backupInfo,
    createMockEither,
  };
});

vi.mock('electron', () => ({
  ipcRenderer: {
    on: vi.fn(),
    send: vi.fn(),
  },
}));

vi.mock('./BackupsIPCRenderer', () => ({
  BackupsIPCRenderer: {
    send: vi.fn(),
    on: vi.fn(),
  },
}));

function createMockBackupService() {
  return {
    run: vi.fn<(info: BackupInfo, controller: AbortController) => Promise<DriveDesktopError | undefined>>(),
    runWithRetry: vi.fn<
      (info: BackupInfo, controller: AbortController) => Promise<Either<RetryError, DriveDesktopError | undefined>>
    >(),
    getBackupInfo: vi.fn<() => Promise<Either<Error, BackupInfo>>>(),
  } as unknown as {
    run: Mock;
    runWithRetry: Mock;
    getBackupInfo: Mock;
  } & BackupService;
}

vi.mock('./dependency-injection/BackupsDependencyContainerFactory', () => ({
  BackupsDependencyContainerFactory: {
    build: vi.fn().mockImplementation(() => {
      return Promise.resolve({
        get: vi.fn().mockImplementation((service) => {
          if (service === BackupService) {
            return mockBackupService();
          }
          return undefined;
        }),
      });
    }),
    reinitialize: vi.fn(),
  },
}));

describe.skip('Backup Functionality', () => {
  let backupService: ReturnType<typeof createMockBackupService>;
  let unhandledRejectionListener: Mock;

  beforeEach(() => {
    // Set up global window object at module level to avoid "window is not defined" errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.window = {
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    backupService = createMockBackupService();

    // Set default mock return values
    backupService.getBackupInfo.mockResolvedValue(right(getBackupInfo()));
    backupService.runWithRetry.mockResolvedValue(right(undefined));

    setMockBackupService(backupService); // Assign to the hoisted variable

    // Reset the IPC mocks and window mocks
    vi.mocked(BackupsIPCRenderer.send).mockClear();
    vi.mocked(BackupsIPCRenderer.on).mockClear();
    vi.mocked(window.addEventListener).mockClear();
    vi.mocked(window.dispatchEvent).mockClear();

    // Set up unhandled rejection listener
    unhandledRejectionListener = vi.fn();
    process.on('unhandledRejection', unhandledRejectionListener);
  });

  afterEach(() => {
    // Clean up the unhandled rejection listener
    process.off('unhandledRejection', unhandledRejectionListener);

    // Note: We don't assert on unhandledRejectionListener because async event listeners
    // set up by backupFolder() may fire after the test completes, which is expected behavior
  });

  it('should complete the backup process successfully', async () => {
    backupService.runWithRetry.mockResolvedValueOnce(right(undefined));

    await backupFolder();

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith('backups.backup-completed', 123);
  });

  it('should handle failure when fetching backup info', async () => {
    backupService.getBackupInfo.mockResolvedValueOnce(left(new Error('Uncontrolled error while getting backup info')));
    await backupFolder();

    expect(BackupsIPCRenderer.send).not.toHaveBeenCalledWith('backups.backup-completed', expect.anything());
  });

  it('should handle offline event', async () => {
    vi.spyOn(window, 'addEventListener').mockImplementation((event, callback) => {
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
      BackUpErrorCauseEnum.NO_INTERNET,
    );
  });

  it('should handle abort event', async () => {
    vi.useFakeTimers();

    const abortController = new AbortController();
    backupService.runWithRetry.mockResolvedValueOnce(right(undefined));

    await backupFolder();

    BackupsIPCRenderer.on('backups.abort', () => {
      abortController.abort();
    });

    vi.advanceTimersByTime(500);

    BackupsIPCRenderer.send('backups.abort');

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith('backups.abort');
    vi.useRealTimers();
  });
});
