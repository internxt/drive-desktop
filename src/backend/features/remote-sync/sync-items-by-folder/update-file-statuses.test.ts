import { fetchFilesByFolder } from './fetch-files-by-folder';
import { deepMocked, mockProps } from '@/tests/vitest/utils.helper.test';
import { updateFileStatuses } from './update-file-statuses';
import { createOrUpdateFile } from '../update-in-sqlite/create-or-update-file';

vi.mock(import('./fetch-files-by-folder'));
vi.mock(import('../update-in-sqlite/create-or-update-file'));

describe('update-file-statuses', () => {
  const fetchFilesByFolderMock = deepMocked(fetchFilesByFolder);
  const createOrUpdateFileMock = vi.mocked(createOrUpdateFile);

  it('should update file statuses', async () => {
    // Given
    fetchFilesByFolderMock.mockResolvedValueOnce([{ uuid: 'uuid' }]);
    const props = mockProps<typeof updateFileStatuses>({ folderUuid: 'folderUuid' });

    // When
    await updateFileStatuses(props);

    // Then
    expect(createOrUpdateFileMock).toBeCalledTimes(1);
    expect(createOrUpdateFileMock).toHaveBeenCalledWith({
      context: props.context,
      fileDto: { uuid: 'uuid' },
    });
  });
});
