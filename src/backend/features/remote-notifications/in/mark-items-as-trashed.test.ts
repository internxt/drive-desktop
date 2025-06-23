import { markItemsAsTrashed } from '@/backend/features/remote-notifications/in/mark-items-as-trashed';
import { loggerMock } from '../../../../../tests/vitest/mocks.helper.test';
import { beforeEach } from 'vitest';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';
import { splitItemsIntoFilesAndFolders } from '@/backend/features/remote-notifications/in/split-items-into-files-and-folders';
import { updateDatabaseStatusToTrashed } from '@/backend/features/remote-notifications/in/update-database-status-to-trashed';

vi.mock(import('@/backend/features/remote-notifications/in/update-database-status-to-trashed'));
vi.mock(import('@/backend/features/remote-notifications/in/split-items-into-files-and-folders'));

describe('markItemsAsTrashed', () => {
  const splitItemsIntoFilesAndFoldersMock = deepMocked(splitItemsIntoFilesAndFolders);
  const updateDatabaseStatusToTrashedMock = deepMocked(updateDatabaseStatusToTrashed);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const items = [
    { type: 'file' as const, uuid: 'file-uuid' },
    { type: 'folder' as const, uuid: 'folder-uuid' },
  ];

  it('should update files and folders to TRASHED status', async () => {
    splitItemsIntoFilesAndFoldersMock.mockReturnValue({
      files: [{ type: 'file', uuid: 'file-uuid' }],
      folders: [{ type: 'folder', uuid: 'folder-uuid' }],
    });
    updateDatabaseStatusToTrashedMock.mockResolvedValueOnce(undefined);
    await markItemsAsTrashed({ items });
    expect(updateDatabaseStatusToTrashedMock).toHaveBeenCalledTimes(1);
  });

  it('should log error and return error object on failure', async () => {
    loggerMock.error.mockReturnValue(new Error('Error while handling ITEMS_TO_TRASH event'));
    updateDatabaseStatusToTrashedMock.mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    await markItemsAsTrashed({ items });
    expect(loggerMock.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Error while handling ITEMS_TO_TRASH event',
        error: expect.any(Error),
      }),
    );
  });
});
