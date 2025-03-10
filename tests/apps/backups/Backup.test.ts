import { BackupService } from '../../../src/apps/backups/BackupService';
import LocalTreeBuilder from '../../../src/context/local/localTree/application/LocalTreeBuilder';
import { RemoteTreeBuilder } from '../../../src/context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { FileBatchUploader } from '../../../src/context/local/localFile/application/upload/FileBatchUploader';
import { FileBatchUpdater } from '../../../src/context/local/localFile/application/update/FileBatchUpdater';
import { FileDeleter } from '../../../src/context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFolderCreator } from '../../../src/context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { UserAvaliableSpaceValidator } from '../../../src/context/user/usage/application/UserAvaliableSpaceValidator';
import { BackupInfo } from '../../../src/apps/backups/BackupInfo';
import { DriveDesktopError } from '../../../src/context/shared/domain/errors/DriveDesktopError';
import { LocalTreeMother } from '../../context/local/tree/domain/LocalTreeMother';
import { RemoteTreeMother } from '../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { left, right } from '../../../src/context/shared/domain/Either';
import { RemoteTree } from '../../../src/context/virtual-drive/remoteTree/domain/RemoteTree';
import { jest } from '@jest/globals';
import { BackupsIPCRenderer } from '../../../src/apps/backups/BackupsIPCRenderer';
import { FolderMother } from '../../context/virtual-drive/folders/domain/FolderMother';
import { Folder } from '../../../src/context/virtual-drive/folders/domain/Folder';

// Mock the BackupsIPCRenderer module
jest.mock('../../../src/apps/backups/BackupsIPCRenderer', () => ({
  BackupsIPCRenderer: {
    send: jest.fn(), // Mock the send method
  },
}));

describe('Backup', () => {
  let backupService: BackupService;
  let localTreeBuilder: jest.Mocked<LocalTreeBuilder>;
  let remoteTreeBuilder: jest.Mocked<RemoteTreeBuilder>;
  let fileBatchUploader: jest.Mocked<FileBatchUploader>;
  let fileBatchUpdater: jest.Mocked<FileBatchUpdater>;
  let remoteFileDeleter: jest.Mocked<FileDeleter>;
  let simpleFolderCreator: jest.Mocked<SimpleFolderCreator>;
  let userAvaliableSpaceValidator: jest.Mocked<UserAvaliableSpaceValidator>;

  beforeEach(() => {
    localTreeBuilder = {
      run: jest.fn(),
      generator: jest.fn(),
      traverse: jest.fn(),
    } as unknown as jest.Mocked<LocalTreeBuilder>;

    remoteTreeBuilder = {
      run: jest.fn(),
      generator: jest.fn(),
      traverse: jest.fn(),
    } as unknown as jest.Mocked<RemoteTreeBuilder>;

    fileBatchUploader = {
      run: jest.fn(),
    } as unknown as jest.Mocked<FileBatchUploader>;

    fileBatchUpdater = {
      run: jest.fn(),
      uploader: jest.fn(),
      simpleFileOverrider: jest.fn(),
    } as unknown as jest.Mocked<FileBatchUpdater>;
    remoteFileDeleter = {
      run: jest.fn(),
    } as unknown as jest.Mocked<FileDeleter>;

    userAvaliableSpaceValidator = {
      run: jest.fn(),
      repository: {},
    } as unknown as jest.Mocked<UserAvaliableSpaceValidator>;

    simpleFolderCreator = {
      run: jest
        .fn<Promise<Folder>, [string, number]>()
        .mockImplementation((_path: string, _parentId: number) => {
          return Promise.resolve(FolderMother.any() as Folder);
        }),
    } as unknown as jest.Mocked<SimpleFolderCreator>;

    backupService = new BackupService(
      localTreeBuilder,
      remoteTreeBuilder,
      fileBatchUploader,
      fileBatchUpdater,
      remoteFileDeleter,
      simpleFolderCreator,
      userAvaliableSpaceValidator
    );

    // Clear the mock before each test
    (BackupsIPCRenderer.send as jest.Mock).mockClear();
  });

  it('should successfully run the backup process', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();
    const localTree = LocalTreeMother.oneLevel(10);
    const remoteTree = RemoteTreeMother.oneLevel(10);

    localTreeBuilder.run.mockResolvedValueOnce(right(localTree));
    remoteTreeBuilder.run.mockResolvedValueOnce(remoteTree);
    userAvaliableSpaceValidator.run.mockResolvedValueOnce(true);

    const result = await backupService.run(info, abortController);

    expect(result).toBeUndefined();
    expect(localTreeBuilder.run).toHaveBeenCalledWith(info.pathname);
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId);
    expect(BackupsIPCRenderer.send).toHaveBeenCalled(); // Check if send was called
  });

  it('should return an error if local tree generation fails', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();
    const error = new DriveDesktopError(
      'NOT_EXISTS',
      'Failed to generate local tree'
    );

    localTreeBuilder.run.mockResolvedValueOnce(left(error));

    const result = await backupService.run(info, abortController);

    expect(result).toBe(error);
    expect(localTreeBuilder.run).toHaveBeenCalledWith(info.pathname);
  });

  it('should return an error if remote tree generation fails', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();
    const error = new DriveDesktopError(
      'NOT_EXISTS',
      'Failed to generate remote tree'
    );

    // Mock the behavior of dependencies
    localTreeBuilder.run.mockResolvedValueOnce(
      right(LocalTreeMother.oneLevel(10))
    );
    remoteTreeBuilder.run.mockResolvedValueOnce(
      left(error) as unknown as Promise<RemoteTree>
    );

    const result = await backupService.run(info, abortController);

    expect(result).toStrictEqual(
      new DriveDesktopError('UNKNOWN', 'An unknown error occurred')
    );
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId);
  });

  it('should return an error if there is not enough space', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();

    localTreeBuilder.run.mockResolvedValueOnce(
      right(LocalTreeMother.oneLevel(10))
    );
    remoteTreeBuilder.run.mockResolvedValueOnce(RemoteTreeMother.oneLevel(10));
    userAvaliableSpaceValidator.run.mockResolvedValueOnce(false);

    const result = await backupService.run(info, abortController);

    expect(result).toBeDefined();
  });

  it('should return an unknown error for unexpected issues', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();

    localTreeBuilder.run.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    const result = await backupService.run(info, abortController);

    expect(result).toBeInstanceOf(DriveDesktopError);
    expect(result?.message).toBe('An unknown error occurred');
  });
});
