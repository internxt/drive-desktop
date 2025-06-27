import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { deepMocked } from '@/tests/vitest/utils.helper.test';
import { updateFolderStatuses } from './update-folder-statuses';
import { In, Not } from 'typeorm';

vi.mock(import('./fetch-folders-by-folder'));
vi.mock(import('@/apps/main/remote-sync/store'));

describe('update-folder-statuses', () => {
  const fetchFoldersByFolderMock = deepMocked(fetchFoldersByFolder);
  const driveFoldersCollectionMock = vi.mocked(driveFoldersCollection);

  it('should update folder statuses', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce([{ uuid: 'uuid' }]);

    // When
    await updateFolderStatuses({ context: { workspaceId: '', workspaceToken: '' }, folderUuid: 'folderUuid' });

    // Then
    expect(driveFoldersCollectionMock.updateInBatch).toBeCalledTimes(2);
    expect(driveFoldersCollectionMock.updateInBatch).toHaveBeenCalledWith({
      payload: { status: 'EXISTS' },
      where: { parentUuid: 'folderUuid', uuid: In(['uuid']) },
    });

    expect(driveFoldersCollectionMock.updateInBatch).toHaveBeenCalledWith({
      payload: { status: 'TRASHED' },
      where: { parentUuid: 'folderUuid', uuid: Not(In(['uuid'])) },
    });
  });
});
