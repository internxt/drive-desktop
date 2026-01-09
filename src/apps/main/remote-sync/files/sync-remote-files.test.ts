import { call, calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { syncRemoteFiles } from './sync-remote-files';
import * as createOrUpdateFilesModule from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

describe('sync-remote-files', () => {
  const createOrUpdateFilesMock = partialSpyOn(createOrUpdateFilesModule, 'createOrUpdateFiles');
  const createOrUpdateCheckpointMock = partialSpyOn(SqliteModule.CheckpointModule, 'createOrUpdate');
  const getFilesMock = partialSpyOn(driveServerWip.files, 'getFiles');

  const { ctx } = mockProps<typeof syncRemoteFiles>({ ctx: {} });

  beforeEach(() => {
    getFilesMock.mockResolvedValue({ data: [] });
    createOrUpdateFilesMock.mockResolvedValue({ data: [] });
  });

  it('should not fetch again if we fetch less than 1000 files', async () => {
    // Given
    getFilesMock.mockResolvedValue({ data: [] });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesMock).toHaveLength(1);
  });

  it('should fetch EXISTS files if from is not provided', async () => {
    // When
    await syncRemoteFiles({ ctx, from: undefined });
    // Then
    call(getFilesMock).toMatchObject({ context: { query: { status: 'EXISTS' } } });
  });

  it('should fetch ALL files if from is provided', async () => {
    // When
    await syncRemoteFiles({ ctx, from: new Date() });
    // Then
    call(getFilesMock).toMatchObject({ context: { query: { status: 'ALL' } } });
  });

  it('should fetch again if we fetch 1000 files', async () => {
    // Given
    getFilesMock.mockResolvedValueOnce({ data: Array(1000).fill({ status: 'EXISTS' }) }).mockResolvedValueOnce({ data: [] });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesMock).toHaveLength(2);
    calls(createOrUpdateFilesMock).toHaveLength(2);
  });

  it('should stop execution if fetch fails', async () => {
    // Given
    getFilesMock.mockResolvedValue({ error: new Error() });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(getFilesMock).toHaveLength(1);
    calls(createOrUpdateFilesMock).toHaveLength(0);
  });

  it('should not update checkpoint if save to database fails', async () => {
    // Given
    createOrUpdateFilesMock.mockResolvedValue({ error: new Error() });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(createOrUpdateFilesMock).toHaveLength(1);
    calls(createOrUpdateCheckpointMock).toHaveLength(0);
  });

  it('update checkpoint after save to database', async () => {
    // Given
    getFilesMock
      .mockResolvedValueOnce({ data: Array(1000).fill({ updatedAt: '2025-06-28T12:25:07.000Z' }) })
      .mockResolvedValueOnce({ data: [{ updatedAt: '2025-06-29T12:25:07.000Z' }] });
    // When
    await syncRemoteFiles({ ctx });
    // Then
    calls(createOrUpdateCheckpointMock).toMatchObject([
      { updatedAt: '2025-06-28T12:25:07.000Z' },
      { updatedAt: '2025-06-29T12:25:07.000Z' },
    ]);
  });
});
