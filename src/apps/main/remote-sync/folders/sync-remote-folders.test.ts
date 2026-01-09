import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFolders } from './sync-remote-folders';
import * as createOrUpdateFoldersModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('sync-remote-folders', () => {
  const createOrUpdateFoldersMock = partialSpyOn(createOrUpdateFoldersModule, 'createOrUpdateFolders');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const getFoldersMock = partialSpyOn(driveServerWip.folders, 'getFolders');

  const { ctx } = mockProps<typeof syncRemoteFolders>({ ctx: {} });

  beforeEach(() => {
    getFoldersMock.mockResolvedValue({ data: [] });
    createOrUpdateFoldersMock.mockResolvedValue({ data: [] });
  });

  it('should not fetch again if we fetch less than 1000 folders', async () => {
    // Given
    getFoldersMock.mockResolvedValue({ data: [] });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(getFoldersMock).toHaveLength(1);
  });

  it('should fetch EXISTS folders if from is not provided', async () => {
    // When
    await syncRemoteFolders({ ctx, from: undefined });
    // Then
    call(getFoldersMock).toMatchObject({ context: { query: { status: 'EXISTS' } } });
  });

  it('should fetch ALL folders if from is provided', async () => {
    // When
    await syncRemoteFolders({ ctx, from: new Date() });
    // Then
    call(getFoldersMock).toMatchObject({ context: { query: { status: 'ALL' } } });
  });

  it('should fetch again if we fetch 1000 folders', async () => {
    // Given
    getFoldersMock.mockResolvedValueOnce({ data: Array(1000).fill({ status: 'EXISTS' }) }).mockResolvedValueOnce({ data: [] });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(getFoldersMock).toHaveLength(2);
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
    createOrUpdateFoldersMock.mockResolvedValue({ error: new Error() });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(createOrUpdateFoldersMock).toHaveLength(1);
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('update checkpoint after save to database', async () => {
    // Given
    getFoldersMock
      .mockResolvedValueOnce({ data: Array(1000).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }) })
      .mockResolvedValueOnce({ data: [{ updatedAt: '2025-06-29T12:25:07.000Z' }] });
    // When
    await syncRemoteFolders({ ctx });
    // Then
    calls(createOrUpdateCheckpointMock).toMatchObject([
      { updatedAt: '2025-06-28T12:25:07.000Z' },
      { updatedAt: '2025-06-29T12:25:07.000Z' },
    ]);
  });
});
