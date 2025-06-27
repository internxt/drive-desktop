import { driveFilesCollection } from '@/apps/main/remote-sync/store';
import { fetchFilesByFolder } from './fetch-files-by-folder';
import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { updateFileStatuses } from './update-file-statuses';
import { In, Not } from 'typeorm';

vi.mock(import('./fetch-files-by-folder'));
vi.mock(import('@/apps/main/remote-sync/store'));

describe('update-file-statuses', () => {
  const fetchFilesByFolderMock = deepMocked(fetchFilesByFolder);
  const driveFilesCollectionMock = vi.mocked(driveFilesCollection);

  it('should update file statuses', async () => {
    // Given
    fetchFilesByFolderMock.mockResolvedValueOnce([{ uuid: 'uuid' }]);

    // When
    await updateFileStatuses({ context: { workspaceId: '', workspaceToken: '' }, folderUuid: 'folderUuid' });

    // Then
    expect(driveFilesCollectionMock.updateInBatch).toBeCalledTimes(2);
    expect(driveFilesCollectionMock.updateInBatch).toHaveBeenCalledWith({
      payload: { status: 'EXISTS' },
      where: { folderUuid: 'folderUuid', uuid: In(['uuid']) },
    });

    expect(driveFilesCollectionMock.updateInBatch).toHaveBeenCalledWith({
      payload: { status: 'TRASHED' },
      where: { folderUuid: 'folderUuid', uuid: Not(In(['uuid'])) },
    });
  });
});
