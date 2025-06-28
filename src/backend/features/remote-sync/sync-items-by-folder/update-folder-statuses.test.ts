import { driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { updateFolderStatuses } from './update-folder-statuses';
import { In } from 'typeorm';

vi.mock(import('./fetch-folders-by-folder'));
vi.mock(import('@/apps/main/remote-sync/store'));

describe('update-folder-statuses', () => {
  const fetchFoldersByFolderMock = deepMocked(fetchFoldersByFolder);
  const driveFoldersCollectionMock = vi.mocked(driveFoldersCollection);

  it('should update folder statuses', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce([{ uuid: 'uuid' }]);
    const props = mockProps<typeof updateFolderStatuses>({ folderUuid: 'folderUuid' });

    // When
    await updateFolderStatuses(props);

    // Then
    expect(driveFoldersCollectionMock.updateInBatch).toBeCalledTimes(1);
    expect(driveFoldersCollectionMock.updateInBatch).toHaveBeenCalledWith({
      payload: { status: 'EXISTS' },
      where: { parentUuid: 'folderUuid', uuid: In(['uuid']) },
    });
  });
});
