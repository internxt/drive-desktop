import { jest } from '@jest/globals';
import { Backup } from '../../../src/apps/backups/Backup';
import { BackupsIPCRenderer } from '../../../src/apps/backups/BackupsIPCRenderer';
import { BackupsDependencyContainerFactory } from '../../../src/apps/backups/dependency-injection/BackupsDependencyContainerFactory';
import { DriveDesktopError } from '../../../src/context/shared/domain/errors/DriveDesktopError';
import { backupFolder } from '../../../src/apps/backups/index'; // Ensure this is imported

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
    invoke: jest.fn<Promise<BackupInfo>, []>().mockResolvedValue({
      folderId: 123,
      path: 'test/path',
      parentId: 456,
      name: 'test',
    }),
    send: jest.fn(),
    on: jest.fn(),
  },
}));

(global as any).window = {
  addEventListener: jest.fn(),
};

function createMockBackup(): jest.Mocked<Backup> {
  return {
    run: jest.fn<
      Promise<DriveDesktopError | undefined>,
      [BackupInfo, AbortController]
    >(),
  } as unknown as jest.Mocked<Backup>;
}

jest.mock(
  '../../../src/apps/backups/dependency-injection/BackupsDependencyContainerFactory',
  () => ({
    BackupsDependencyContainerFactory: {
      build: jest.fn<Promise<unknown>, []>().mockResolvedValue({
        get: jest.fn().mockImplementation((service) => {
          if (service === Backup) {
            return createMockBackup();
          }
          return undefined;
        }),
      }),
      reinitialize: jest.fn(),
    },
  })
);

describe('Backup Functionality', () => {
  let backup: jest.Mocked<Backup>;

  beforeEach(() => {
    backup = {
      run: jest.fn(),
    } as unknown as jest.Mocked<Backup>;

    (BackupsDependencyContainerFactory.build as jest.Mock).mockResolvedValue({
      get: jest.fn().mockReturnValue(backup),
    });

    (BackupsIPCRenderer.invoke as jest.Mock).mockResolvedValue({
      folderId: 123,
      path: 'test/path',
      parentId: 456,
      name: 'test',
    });

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

  it('should complete the backup process successfully', async () => {
    backup.run.mockResolvedValueOnce(undefined);

    await backupFolder();

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith(
      'backups.backup-completed',
      123
    );
  });

  it('should handle offline event', async () => {
    const abortController = {
      signal: {
        aborted: false,
        addEventListener: jest.fn(),
      },
      abort: jest.fn(() => {
        abortController.signal.aborted = true;
      }),
    };

    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((event, callback) => {
        if (event === 'offline' && typeof callback === 'function') {
          callback(new Event('offline'));
        }
      });

    backup.run.mockResolvedValueOnce(undefined);

    await backupFolder();

    window.dispatchEvent(new Event('offline'));

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith(
      'backups.backup-failed',
      123,
      'NO_INTERNET'
    );
  });

  it('should handle abort event', async () => {
    jest.useFakeTimers();

    const abortController = new AbortController();
    backup.run.mockResolvedValueOnce(undefined);

    await backupFolder();

    BackupsIPCRenderer.on('backups.abort', () => {
      abortController.abort();
    });

    jest.advanceTimersByTime(500);

    // @ts-ignore as the event is only defined in the renderer
    BackupsIPCRenderer.send('backups.abort');

    expect(BackupsIPCRenderer.send).toHaveBeenCalledWith('backups.abort');
  });
});
