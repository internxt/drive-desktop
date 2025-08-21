import { BackupService } from './BackupService';
import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileDeleter } from '../../context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupInfo } from './BackupInfo';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { LocalTreeMother } from '../../../tests/context/local/tree/domain/LocalTreeMother';
import { RemoteTreeMother } from '../../../tests/context/virtual-drive/tree/domain/RemoteTreeMother';
import { left, right } from '../../context/shared/domain/Either';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { jest } from '@jest/globals';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { FolderMother } from '../../../tests/context/virtual-drive/folders/domain/FolderMother';
import { Folder } from '../../context/virtual-drive/folders/domain/Folder';
import { BackupsDanglingFilesService } from './BackupsDanglingFilesService';
import { DiffFilesCalculatorService } from './diff/DiffFilesCalculatorService';
import { UsageModule } from '../../backend/features/usage/usage.module';

// Mock the BackupsIPCRenderer module
jest.mock('./BackupsIPCRenderer', () => ({
  BackupsIPCRenderer: {
    send: jest.fn(), // Mock the send method
  },
}));

// Mock the UsageModule
jest.mock('../../backend/features/usage/usage.module', () => ({
  UsageModule: {
    validateSpace: jest.fn(),
  },
}));

// Mock the Environment module
jest.mock('@internxt/inxt-js', () => ({
  Environment: {
    get: jest.fn(),
  },
}));

describe('BackupService', () => {
  let backupService: BackupService;
  let localTreeBuilder: jest.Mocked<LocalTreeBuilder>;
  let remoteTreeBuilder: jest.Mocked<RemoteTreeBuilder>;
  let fileBatchUploader: jest.Mocked<FileBatchUploader>;
  let fileBatchUpdater: jest.Mocked<FileBatchUpdater>;
  let remoteFileDeleter: jest.Mocked<FileDeleter>;
  let simpleFolderCreator: jest.Mocked<SimpleFolderCreator>;
  let backupsDanglingFilesService: jest.Mocked<BackupsDanglingFilesService>;
  let mockValidateSpace: jest.MockedFunction<typeof UsageModule.validateSpace>;

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

    mockValidateSpace = UsageModule.validateSpace as jest.MockedFunction<typeof UsageModule.validateSpace>;

    backupsDanglingFilesService = {
      handleDanglingFilesOnBackup: jest.fn(),
    } as unknown as jest.Mocked<BackupsDanglingFilesService>;

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
      backupsDanglingFilesService
    );

    // Clear the mocks before each test
    (BackupsIPCRenderer.send as jest.Mock).mockClear();
    mockValidateSpace.mockClear();
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
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });

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
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: false } });

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

  it('should properly handle dangled files when found while calculating diff in files', async () => {
    const info: BackupInfo = {
      pathname: '/path/to/backup',
      folderId: 123,
      folderUuid: 'uuid',
      tmpPath: '/tmp/path',
      backupsBucket: 'backups-bucket',
      name: 'backup-name',
    };
    const abortController = new AbortController();
    const localTree = LocalTreeMother.oneLevel(1);
    const remoteTree = RemoteTreeMother.oneLevel(1);

    // Simular archivos dangling
    const danglingFile = localTree.files[0];
    const remoteFile = remoteTree.files[0];

    const fakeDiff = {
      added: [],
      modified: new Map(),
      deleted: [],
      unmodified: [],
      dangling: new Map([[danglingFile, remoteFile]]),
      total: 0,
    };

    localTreeBuilder.run.mockResolvedValueOnce(right(localTree));
    remoteTreeBuilder.run.mockResolvedValueOnce(remoteTree);
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });
    backupsDanglingFilesService.handleDanglingFilesOnBackup.mockResolvedValueOnce(
      new Map([[danglingFile, remoteFile]])
    );

    const originalCalculate = DiffFilesCalculatorService.calculate;
    DiffFilesCalculatorService.calculate = jest.fn(() => fakeDiff);

    const result = await backupService.run(info, abortController);

    DiffFilesCalculatorService.calculate = originalCalculate;

    expect(result).toBeUndefined();
    expect(
      backupsDanglingFilesService.handleDanglingFilesOnBackup
    ).toHaveBeenCalledWith(fakeDiff.dangling);
    expect(fileBatchUpdater.run).toHaveBeenCalledWith(
      localTree.root,
      remoteTree,
      [danglingFile],
      abortController.signal
    );
  });
});
