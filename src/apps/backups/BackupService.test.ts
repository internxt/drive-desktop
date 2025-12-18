import { vi, Mock } from 'vitest';
import { BackupService } from './BackupService';
import LocalTreeBuilder from '../../context/local/localTree/application/LocalTreeBuilder';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { FileBatchUploader } from '../../context/local/localFile/application/upload/FileBatchUploader';
import { FileBatchUpdater } from '../../context/local/localFile/application/update/FileBatchUpdater';
import { FileDeleter } from '../../context/virtual-drive/files/application/delete/FileDeleter';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupInfo } from './BackupInfo';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { LocalTreeMother } from '../../context/local/localTree/domain/__test-helpers__/LocalTreeMother';
import { RemoteTreeMother } from '../../context/virtual-drive/remoteTree/domain/__test-helpers__/RemoteTreeMother';
import { left, right } from '../../context/shared/domain/Either';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { BackupsIPCRenderer } from './BackupsIPCRenderer';
import { Folder } from '../../context/virtual-drive/folders/domain/Folder';
import { BackupsDanglingFilesService } from './BackupsDanglingFilesService';
import { DiffFilesCalculatorService } from './diff/DiffFilesCalculatorService';
import { UsageModule } from '../../backend/features/usage/usage.module';
import { FolderMother } from '../../context/virtual-drive/folders/domain/__test-helpers__/FolderMother';

// Mock the BackupsIPCRenderer module
vi.mock('./BackupsIPCRenderer', () => ({
  BackupsIPCRenderer: {
    send: vi.fn(), // Mock the send method
  },
}));

// Mock the UsageModule
vi.mock('../../backend/features/usage/usage.module', () => ({
  UsageModule: {
    validateSpace: vi.fn(),
  },
}));

// Mock the Environment module
vi.mock('@internxt/inxt-js', () => ({
  Environment: {
    get: vi.fn(),
  },
}));

describe('BackupService', () => {
  let backupService: BackupService;
  let localTreeBuilder: LocalTreeBuilder;
  let remoteTreeBuilder: RemoteTreeBuilder;
  let fileBatchUploader: FileBatchUploader;
  let fileBatchUpdater: FileBatchUpdater;
  let remoteFileDeleter: FileDeleter;
  let simpleFolderCreator: SimpleFolderCreator;
  let backupsDanglingFilesService: BackupsDanglingFilesService;
  let mockValidateSpace: Mock;

  beforeEach(() => {
    localTreeBuilder = {
      run: vi.fn(),
      generator: vi.fn(),
      traverse: vi.fn(),
    } as unknown as LocalTreeBuilder;

    remoteTreeBuilder = {
      run: vi.fn(),
      generator: vi.fn(),
      traverse: vi.fn(),
    } as unknown as RemoteTreeBuilder;

    fileBatchUploader = {
      run: vi.fn(),
    } as unknown as FileBatchUploader;

    fileBatchUpdater = {
      run: vi.fn(),
      uploader: vi.fn(),
      simpleFileOverrider: vi.fn(),
    } as unknown as FileBatchUpdater;
    remoteFileDeleter = {
      run: vi.fn(),
    } as unknown as FileDeleter;

    mockValidateSpace = UsageModule.validateSpace as Mock;

    backupsDanglingFilesService = {
      handleDanglingFilesOnBackup: vi.fn(),
    } as unknown as BackupsDanglingFilesService;

    simpleFolderCreator = {
      run: vi.fn().mockImplementation(() => {
        return Promise.resolve(FolderMother.any() as Folder);
      }),
    } as unknown as SimpleFolderCreator;

    backupService = new BackupService(
      localTreeBuilder,
      remoteTreeBuilder,
      fileBatchUploader,
      fileBatchUpdater,
      remoteFileDeleter,
      simpleFolderCreator,
      backupsDanglingFilesService,
    );

    // Clear the mocks before each test
    (BackupsIPCRenderer.send as Mock).mockClear();
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

    (localTreeBuilder.run as Mock).mockResolvedValueOnce(right(localTree));
    (remoteTreeBuilder.run as Mock).mockResolvedValueOnce(remoteTree);
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });

    const result = await backupService.run(info, abortController);

    expect(result).toBeUndefined();
    expect(localTreeBuilder.run).toHaveBeenCalledWith(info.pathname);
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId, info.folderUuid);
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
    const error = new DriveDesktopError('NOT_EXISTS', 'Failed to generate local tree');

    (localTreeBuilder.run as Mock).mockResolvedValueOnce(left(error));

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
    const error = new DriveDesktopError('NOT_EXISTS', 'Failed to generate remote tree');

    // Mock the behavior of dependencies
    (localTreeBuilder.run as Mock).mockResolvedValueOnce(right(LocalTreeMother.oneLevel(10)));
    (remoteTreeBuilder.run as Mock).mockResolvedValueOnce(left(error) as unknown as Promise<RemoteTree>);

    const result = await backupService.run(info, abortController);

    expect(result).toStrictEqual(new DriveDesktopError('UNKNOWN', 'An unknown error occurred'));
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId, info.folderUuid);
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

    (localTreeBuilder.run as Mock).mockResolvedValueOnce(right(LocalTreeMother.oneLevel(10)));
    (remoteTreeBuilder.run as Mock).mockResolvedValueOnce(RemoteTreeMother.oneLevel(10));
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

    (localTreeBuilder.run as Mock).mockImplementationOnce(() => {
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

    (localTreeBuilder.run as Mock).mockResolvedValueOnce(right(localTree));
    (remoteTreeBuilder.run as Mock).mockResolvedValueOnce(remoteTree);
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });
    (backupsDanglingFilesService.handleDanglingFilesOnBackup as Mock).mockResolvedValueOnce(
      new Map([[danglingFile, remoteFile]]),
    );

    const originalCalculate = DiffFilesCalculatorService.calculate;
    DiffFilesCalculatorService.calculate = vi.fn(() => fakeDiff);

    const result = await backupService.run(info, abortController);

    DiffFilesCalculatorService.calculate = originalCalculate;

    expect(result).toBeUndefined();
    expect(backupsDanglingFilesService.handleDanglingFilesOnBackup).toHaveBeenCalledWith(fakeDiff.dangling);
    expect(fileBatchUpdater.run).toHaveBeenCalledWith(
      localTree.root,
      remoteTree,
      [danglingFile],
      abortController.signal,
    );
  });
});
