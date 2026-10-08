import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import * as createOrUpdateFoldersModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';
import { syncRemoteFolders } from './sync-remote-folders';

describe('sync-remote-folders', () => {
  const createOrUpdateFoldersMock = partialSpyOn(createOrUpdateFoldersModule, 'createOrUpdateFolders');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const getFoldersMock = partialSpyOn(driveServerWip.workspaces, 'getFoldersSyncPage');

  const { ctx } = mockProps<typeof syncRemoteFolders>({ ctx: { workspaceId: 'workspace-id' } });

  beforeEach(() => {
    getFoldersMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    createOrUpdateFoldersMock.mockResolvedValue(undefined);
  });

  it('should not fetch again if we fetch less than 1000 folders', async () => {
    // Given
    getFoldersMock.mockResolvedValue({ data: { items: [], nextCursor: null } });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(getFoldersMock).toHaveLength(1);
  });

  it('should fetch EXISTS folders if from is not provided', async () => {
    // When
    await syncRemoteFolders({ ctx, from: undefined });
    // Then
    call(getFoldersMock).toMatchObject({ context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000, status: 'EXISTS' } } });
  });

  it('should request only existing folders for an initial synchronization', async () => {
    // When
    await syncRemoteFolders({ ctx, from: undefined });
    // Then
    call(getFoldersMock).toMatchObject({ context: { query: { status: 'EXISTS' } } });
  });

  it('should fetch ALL folders if from is provided', async () => {
    // When
    await syncRemoteFolders({ ctx, from: new Date() });
    // Then
    call(getFoldersMock).toMatchObject({ context: { query: { updatedAt: expect.any(String), limit: 1000 } } });
  });

  it('should fetch again if we fetch 1000 folders', async () => {
    // Given
    getFoldersMock
      .mockResolvedValueOnce({ data: { items: Array(1000).fill({ status: 'EXISTS' }), nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [], nextCursor: null } });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(getFoldersMock).toHaveLength(2);
    calls(getFoldersMock).toMatchObject([
      { context: { query: { updatedAt: '1970-01-01T00:00:00.000Z', limit: 1000, status: 'EXISTS' } } },
      { context: { query: { cursor: 'cursor-1', limit: 1000, status: 'EXISTS' } } },
    ]);
    calls(createOrUpdateFoldersMock).toHaveLength(2);
  });

  it('should stop execution if fetch fails', async () => {
    // Given
    getFoldersMock.mockResolvedValue({ error: new Error() });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(getFoldersMock).toHaveLength(1);
    calls(createOrUpdateFoldersMock).toHaveLength(0);
  });

  it('should not update checkpoint if save to database fails', async () => {
    // Given
    createOrUpdateFoldersMock.mockResolvedValue(new Error());
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(createOrUpdateFoldersMock).toHaveLength(1);
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('update checkpoint after save to database', async () => {
    // Given
    getFoldersMock
      .mockResolvedValueOnce({ data: { items: Array(1000).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }), nextCursor: 'cursor-1' } })
      .mockResolvedValueOnce({ data: { items: [{ updatedAt: '2025-06-29T12:25:07.000Z' }], nextCursor: null } });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(createOrUpdateCheckpointMock).toMatchObject([
      { updatedAt: '2025-06-28T12:25:07.000Z' },
      { updatedAt: '2025-06-29T12:25:07.000Z' },
    ]);
  });
});
