import { fetchFoldersByFolder } from './fetch-folders-by-folder';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { updateFolderStatuses } from './update-folder-statuses';
import { createOrUpdateFolder } from '../update-in-sqlite/create-or-update-folder';

vi.mock(import('./fetch-folders-by-folder'));
vi.mock(import('../update-in-sqlite/create-or-update-folder'));

describe('update-folder-statuses', () => {
  const fetchFoldersByFolderMock = deepMocked(fetchFoldersByFolder);
  const createOrUpdateFolderMock = vi.mocked(createOrUpdateFolder);

  it('should update folder statuses', async () => {
    // Given
    fetchFoldersByFolderMock.mockResolvedValueOnce([{ uuid: 'uuid' }]);
    const props = mockProps<typeof updateFolderStatuses>({ folderUuid: 'folderUuid' });

    // When
    await updateFolderStatuses(props);

    // Then
    expect(createOrUpdateFolderMock).toBeCalledTimes(1);
    expect(createOrUpdateFolderMock).toHaveBeenCalledWith({
      context: props.context,
      folderDto: { uuid: 'uuid' },
    });
  });
});
