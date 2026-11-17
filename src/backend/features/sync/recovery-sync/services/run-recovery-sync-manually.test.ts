import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as syncManager from '@/apps/main/remote-sync/RemoteSyncManager';
import { updateRemoteSync } from '@/apps/main/remote-sync/handlers';
import * as syncStore from '@/apps/main/remote-sync/store';
import * as placeholders from '@/apps/sync-engine/refresh-item-placeholders';
import * as deletePlaceholder from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import * as updateFile from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import * as updateFolder from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import * as fileExplorerPaths from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as traverser from '@/context/virtual-drive/items/application/Traverser';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createRecoverySyncAbortError } from '../common/create-recovery-sync-abort-error';
import { RecoverySyncModule } from '../recovery-sync.module';
import { runRecoverySyncManually } from './run-recovery-sync-manually';

describe('run-recovery-sync-manually', () => {
  const refreshItemPlaceholders = placeholders.refreshItemPlaceholders;
  const getContextsMock = partialSpyOn(syncStore, 'getSyncContexts');
  const recoveryMock = partialSpyOn(RecoverySyncModule, 'recoverySync');
  const refreshMock = partialSpyOn(placeholders, 'refreshItemPlaceholders');
  const statusMock = partialSpyOn(syncManager, 'changeSyncStatus', false);
  const checkpointSyncMock = partialSpyOn(syncManager, 'startSyncByCheckpoint');
  const getFilesMock = partialSpyOn(SqliteModule.FileModule, 'getByWorkspaceId');
  const getFoldersMock = partialSpyOn(SqliteModule.FolderModule, 'getByWorkspaceId');
  const pathsMock = partialSpyOn(fileExplorerPaths, 'loadInMemoryPaths');
  const updateFileMock = partialSpyOn(updateFile, 'updateFilePlaceholder');
  const updateFolderMock = partialSpyOn(updateFolder, 'updateFolderPlaceholder');
  const deletePlaceholderMock = partialSpyOn(deletePlaceholder, 'deleteItemPlaceholder');

  beforeEach(() => {
    recoveryMock.mockResolvedValue(Result.ok(true));
    refreshMock.mockResolvedValue(Result.ok(true));
  });

  function createContext(workspaceId: string) {
    return mockProps<typeof RecoverySyncModule.recoverySync>({
      ctx: { workspaceId, status: 'SYNCED', abortController: new AbortController() },
    }).ctx;
  }

  it('recovers personal Drive and all workspaces, then refreshes placeholders', async () => {
    // Given
    const contexts = [createContext(''), createContext('workspace')];
    getContextsMock.mockReturnValue(contexts);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBeUndefined();
    expect(recoveryMock).toHaveBeenCalledTimes(2);
    for (const ctx of contexts) {
      expect(recoveryMock).toHaveBeenCalledWith({ ctx });
      expect(refreshMock).toHaveBeenCalledWith({ ctx, isFirstExecution: false });
      expect(ctx.status).toBe('SYNCED');
    }
    expect(statusMock.mock.calls.slice(0, 2).map(([props]) => props.status)).toEqual(['SYNCING', 'SYNCING']);
  });

  it('does not start recovery if any context is already syncing', async () => {
    // Given
    const busyContext = createContext('workspace');
    busyContext.status = 'SYNCING';
    getContextsMock.mockReturnValue([createContext(''), busyContext]);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(recoveryMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(busyContext.status).toBe('SYNCING');
  });

  it('prevents a second request while recovery is running', async () => {
    // Given
    const ctx = createContext('');
    getContextsMock.mockReturnValue([ctx]);
    // When
    const firstRun = runRecoverySyncManually();
    const secondResult = await runRecoverySyncManually();
    await firstRun;
    // Then
    expect(secondResult.error).toBeInstanceOf(Error);
    expect(recoveryMock).toHaveBeenCalledTimes(1);
  });

  it('marks recovery failures and does not refresh placeholders', async () => {
    // Given
    const ctx = createContext('');
    const error = new Error('Recovery failed');
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockResolvedValue(Result.err(error));
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(ctx.status).toBe('SYNC_FAILED');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('skips placeholder refresh and status broadcasts when recovery is cancelled by logout', async () => {
    // Given
    const ctx = createContext('');
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockImplementationOnce(() => {
      ctx.abortController.abort();
      return Promise.resolve(Result.err(createRecoverySyncAbortError()));
    });
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledTimes(1);
    expect(statusMock).toHaveBeenCalledWith({ ctx, status: 'SYNCING' });
    expect(ctx.logger.error).not.toHaveBeenCalled();
  });

  it('does not refresh or report success if logout occurs as recovery finishes', async () => {
    // Given
    const ctx = createContext('');
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockImplementationOnce(() => {
      ctx.abortController.abort();
      return Promise.resolve(Result.ok(true));
    });
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(refreshMock).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledTimes(1);
  });

  it('does not publish a synced status if logout occurs during placeholder refresh', async () => {
    // Given
    const ctx = createContext('');
    getContextsMock.mockReturnValue([ctx]);
    refreshMock.mockImplementationOnce(() => {
      ctx.abortController.abort();
      return Promise.resolve(Result.ok(true));
    });
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error?.name).toBe('AbortError');
    expect(statusMock).toHaveBeenCalledTimes(1);
  });

  it('does not log or report a failure for a cancellation rejection', async () => {
    // Given
    const ctx = createContext('');
    const error = createRecoverySyncAbortError();
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockRejectedValueOnce(error);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(ctx.status).toBe('IDLE');
    expect(ctx.logger.error).not.toHaveBeenCalled();
  });

  it('releases the syncing status when recovery returns cancellation without logout', async () => {
    // Given
    const ctx = createContext('');
    const error = createRecoverySyncAbortError();
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockResolvedValueOnce(Result.err(error));
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(ctx.status).toBe('IDLE');
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('handles unexpected failures and clears the syncing status', async () => {
    // Given
    const ctx = createContext('');
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockRejectedValue(new Error('Unexpected failure'));
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(ctx.status).toBe('SYNC_FAILED');
  });

  it('returns an error when no workers are loaded', async () => {
    // Given
    getContextsMock.mockReturnValue([]);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBeInstanceOf(Error);
    expect(recoveryMock).not.toHaveBeenCalled();
  });

  it('keeps sync blocked until the placeholder refresh finishes', async () => {
    // Given
    const ctx = createContext('');
    const refresh = Promise.withResolvers<Result<boolean, Error>>();
    const refreshStarted = Promise.withResolvers<void>();
    getContextsMock.mockReturnValue([ctx]);
    refreshMock.mockImplementation(() => {
      refreshStarted.resolve();
      return refresh.promise;
    });
    // When
    const recoveryRun = runRecoverySyncManually();
    await refreshStarted.promise;
    const secondResult = await runRecoverySyncManually();
    await updateRemoteSync({ ctx });
    // Then
    expect(ctx.status).toBe('SYNCING');
    expect(secondResult.error).toBeInstanceOf(Error);
    expect(recoveryMock).toHaveBeenCalledTimes(1);
    expect(checkpointSyncMock).not.toHaveBeenCalled();
    refresh.resolve(Result.ok(true));
    expect(await recoveryRun).toEqual(Result.ok(true));
    expect(ctx.status).toBe('SYNCED');
  });

  it('refreshes Explorer using the database state read after recovery completes', async () => {
    // Given
    const recovery = Promise.withResolvers<Result<boolean, Error>>();
    const snapshot = mockProps<typeof traverser.traverse>({
      ctx: { rootUuid: 'root' as FolderUuid, rootPath: abs(String.raw`C:\Drive`) },
      database: {
        files: [
          { uuid: 'updated-file' as FileUuid, name: 'recovered.txt', parentUuid: 'root', status: 'EXISTS', size: 42 },
          { uuid: 'deleted-file' as FileUuid, name: 'deleted.txt', parentUuid: 'root', status: 'DELETED' },
        ],
        folders: [{ uuid: 'updated-folder' as FolderUuid, name: 'recovered-folder', parentUuid: 'root', status: 'EXISTS' }],
      },
    });
    const ctx = { ...createContext('workspace'), rootUuid: snapshot.ctx.rootUuid, rootPath: snapshot.ctx.rootPath };
    getContextsMock.mockReturnValue([ctx]);
    recoveryMock.mockReturnValue(recovery.promise);
    refreshMock.mockImplementation(refreshItemPlaceholders);
    getFilesMock.mockReturnValue({ data: [] });
    getFoldersMock.mockReturnValue({ data: [] });
    pathsMock.mockResolvedValue({ files: new Map(), folders: new Map() });
    updateFolderMock.mockResolvedValue(true);
    // When
    const recoveryRun = runRecoverySyncManually();
    // Then
    expect(getFilesMock).not.toHaveBeenCalled();
    expect(getFoldersMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
    // When
    getFilesMock.mockReturnValue({ data: snapshot.database.files });
    getFoldersMock.mockReturnValue({ data: snapshot.database.folders });
    recovery.resolve(Result.ok(true));
    const result = await recoveryRun;
    // Then
    expect(result).toEqual(Result.ok(true));
    expect(getFilesMock).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'workspace' }));
    expect(getFoldersMock).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: 'workspace' }));

    expect(updateFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        remote: expect.objectContaining({ uuid: 'updated-file', name: 'recovered.txt', size: 42 }),
        isFirstExecution: false,
      }),
    );

    expect(updateFolderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        remote: expect.objectContaining({ uuid: 'updated-folder', name: 'recovered-folder' }),
      }),
    );

    expect(deletePlaceholderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'file',
        remote: expect.objectContaining({ uuid: 'deleted-file', status: 'DELETED' }),
      }),
    );
  });

  it('finishes successful workspaces even if another workspace fails', async () => {
    // Given
    const contexts = [createContext(''), createContext('workspace')];
    const error = new Error('Recovery failed');
    getContextsMock.mockReturnValue(contexts);
    recoveryMock.mockResolvedValueOnce(Result.err(error)).mockResolvedValueOnce(Result.ok(true));
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(contexts.map((ctx) => ctx.status)).toEqual(['SYNC_FAILED', 'SYNCED']);
    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(refreshMock).toHaveBeenCalledWith({ ctx: contexts[1], isFirstExecution: false });
  });

  it('returns placeholder refresh rejections as errors', async () => {
    // Given
    const ctx = createContext('');
    const error = new Error('Placeholder refresh failed');
    getContextsMock.mockReturnValue([ctx]);
    refreshMock.mockRejectedValueOnce(error);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(ctx.status).toBe('SYNC_FAILED');
  });

  it('marks sync failed when the real placeholder refresh catches an error', async () => {
    // Given
    const ctx = createContext('');
    const error = new Error('Failed to read Explorer placeholders');
    getContextsMock.mockReturnValue([ctx]);
    refreshMock.mockImplementation(refreshItemPlaceholders);
    getFilesMock.mockReturnValue({ data: [] });
    getFoldersMock.mockReturnValue({ data: [] });
    pathsMock.mockRejectedValueOnce(error);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result.error).toBe(error);
    expect(ctx.status).toBe('SYNC_FAILED');
    expect(statusMock).not.toHaveBeenCalledWith({ ctx, status: 'SYNCED' });
    expect(ctx.logger.error).toHaveBeenCalledWith({ msg: 'Error refreshing item placeholders', error });
  });

  it.each(['IDLE', 'SYNCED', 'SYNC_FAILED'] as const)('allows recovery when the previous status is %s', async (status) => {
    // Given
    const ctx = { ...createContext(''), status };
    getContextsMock.mockReturnValue([ctx]);
    // When
    const result = await runRecoverySyncManually();
    // Then
    expect(result).toEqual(Result.ok(true));
    expect(recoveryMock).toHaveBeenCalledWith({ ctx });
    expect(ctx.status).toBe('SYNCED');
  });
});
