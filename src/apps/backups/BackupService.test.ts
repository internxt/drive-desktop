import { Environment } from '@internxt/inxt-js';
import { Mock } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { BackupService } from './BackupService';
import { RemoteTreeBuilder } from '../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { SimpleFolderCreator } from '../../context/virtual-drive/folders/application/create/SimpleFolderCreator';
import { BackupInfo } from './BackupInfo';
import { DriveDesktopError } from '../../context/shared/domain/errors/DriveDesktopError';
import { LocalTreeMother } from '../../context/local/localTree/domain/__test-helpers__/LocalTreeMother';
import { RemoteTreeMother } from '../../context/virtual-drive/remoteTree/domain/__test-helpers__/RemoteTreeMother';
import { left } from '../../context/shared/domain/Either';
import { RemoteTree } from '../../context/virtual-drive/remoteTree/domain/RemoteTree';
import { UsageModule } from '../../backend/features/usage/usage.module';
import { FolderMother } from '../../context/virtual-drive/folders/domain/__test-helpers__/FolderMother';
import { BackupProgressTracker } from '../../backend/features/backup/backup-progress-tracker';
import * as executeAsyncQueueModule from '../../backend/common/async-queue/execute-async-queue';
import * as addFileToTrashModule from '../../infra/drive-server/services/files/services/add-file-to-trash';
import { partialSpyOn } from '../../../tests/vitest/utils.helper';
import { AbsolutePath } from '../../context/local/localFile/infrastructure/AbsolutePath';
import * as buildLocalTreeModule from '../../backend/features/backup/local-tree/';
import * as backupFeaturesModule from '../../backend/features/backup';

vi.mock(import('../../backend/features/usage/usage.module'));
vi.mock(import('../../backend/features/backup/local-tree/'));

describe('BackupService', () => {
  const executeAsyncQueueMock = partialSpyOn(executeAsyncQueueModule, 'executeAsyncQueue');
  const addFileToTrashMock = partialSpyOn(addFileToTrashModule, 'addFileToTrash');
  const buildLocalTreeMock = vi.mocked(buildLocalTreeModule.buildLocalTree);
  const backupErrorsTrackerAddMock = partialSpyOn(backupFeaturesModule.backupErrorsTracker, 'add');

  let backupService: BackupService;
  let remoteTreeBuilder: RemoteTreeBuilder;
  let simpleFolderCreator: SimpleFolderCreator;
  let environment: Environment;
  let mockValidateSpace: Mock;
  let abortController: AbortController;
  let tracker: BackupProgressTracker;

  const info: BackupInfo = {
    pathname: '/path/to/backup' as AbsolutePath,
    folderId: 123,
    folderUuid: 'uuid',
    tmpPath: '/tmp/path',
    backupsBucket: 'backups-bucket',
    name: 'backup-name',
  };

  beforeEach(() => {
    remoteTreeBuilder = mockDeep<RemoteTreeBuilder>();
    simpleFolderCreator = mockDeep<SimpleFolderCreator>();
    environment = mockDeep<Environment>();
    tracker = mockDeep<BackupProgressTracker>();

    mockValidateSpace = vi.mocked(UsageModule.validateSpace);
    abortController = new AbortController();

    buildLocalTreeMock.mockResolvedValue({ data: { tree: LocalTreeMother.oneLevel(10), skippedItems: [] } });
    vi.mocked(remoteTreeBuilder.run).mockResolvedValue(RemoteTreeMother.oneLevel(10));
    mockValidateSpace.mockResolvedValue({ data: { hasSpace: true } });
    vi.mocked(simpleFolderCreator.run).mockResolvedValue(FolderMother.any());
    executeAsyncQueueMock.mockResolvedValue({ data: undefined });
    addFileToTrashMock.mockResolvedValue({ data: true });

    backupService = new BackupService(remoteTreeBuilder, simpleFolderCreator, environment, 'backups-bucket');

    mockValidateSpace.mockClear();
    backupErrorsTrackerAddMock.mockClear();
  });

  it('should successfully run the backup process', async () => {
    const remoteTree = RemoteTreeMother.oneLevel(10);

    vi.mocked(remoteTreeBuilder.run).mockResolvedValueOnce(remoteTree);
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBeUndefined();
    expect(buildLocalTreeMock).toHaveBeenCalledWith(info.pathname);
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId, info.folderUuid, true);
    expect(tracker.incrementProcessed).toHaveBeenCalled();
  });

  it('should return an error if local tree generation fails', async () => {
    const error = new DriveDesktopError('NOT_EXISTS', 'Failed to generate local tree');

    buildLocalTreeMock.mockResolvedValueOnce({ error });

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBe(error);
    expect(buildLocalTreeMock).toHaveBeenCalledWith(info.pathname);
  });

  it('should add skipped local tree items as individual backup issues', async () => {
    const skippedError = new DriveDesktopError('ACTION_NOT_PERMITTED', 'Symbolic links are skipped');
    buildLocalTreeMock.mockResolvedValueOnce({
      data: {
        tree: LocalTreeMother.oneLevel(10),
        skippedItems: [{ path: '/path/to/backup/thunderbird-link' as AbsolutePath, error: skippedError }],
      },
    });

    await backupService.run(info, abortController.signal, tracker);

    expect(backupErrorsTrackerAddMock).toHaveBeenCalledWith(info.folderId, {
      name: 'thunderbird-link',
      error: 'ACTION_NOT_PERMITTED',
    });
  });

  it('should return an error if remote tree generation fails', async () => {
    const error = new DriveDesktopError('NOT_EXISTS', 'Failed to generate remote tree');

    vi.mocked(remoteTreeBuilder.run).mockResolvedValueOnce(left(error) as unknown as RemoteTree);

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toStrictEqual(new DriveDesktopError('UNKNOWN', 'An unknown error occurred'));
    expect(remoteTreeBuilder.run).toHaveBeenCalledWith(info.folderId, info.folderUuid, true);
  });

  it('should return an error if there is not enough space', async () => {
    vi.mocked(remoteTreeBuilder.run).mockResolvedValueOnce(RemoteTreeMother.oneLevel(10));
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: false } });

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBeDefined();
  });

  it('should return an unknown error for unexpected issues', async () => {
    buildLocalTreeMock.mockRejectedValueOnce(new Error('Unexpected error'));

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBeInstanceOf(DriveDesktopError);
    expect(result?.message).toBe('An unknown error occurred');
  });

  it('should propagate fatal error from uploadAndCreate', async () => {
    const fatalError = new DriveDesktopError('NOT_ENOUGH_SPACE', 'No space left');

    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });
    executeAsyncQueueMock.mockResolvedValueOnce({ error: fatalError });

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBe(fatalError);
  });

  it('should propagate fatal error from uploadAndUpdate', async () => {
    const fatalError = new DriveDesktopError('NOT_ENOUGH_SPACE', 'No space left');

    vi.mocked(remoteTreeBuilder.run).mockResolvedValueOnce(RemoteTreeMother.oneLevel(10));
    mockValidateSpace.mockResolvedValueOnce({ data: { hasSpace: true } });
    executeAsyncQueueMock.mockResolvedValueOnce({ data: undefined }).mockResolvedValueOnce({ error: fatalError });

    const result = await backupService.run(info, abortController.signal, tracker);

    expect(result).toBe(fatalError);
  });
});
