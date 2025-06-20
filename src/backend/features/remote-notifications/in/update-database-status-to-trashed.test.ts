import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';
import { driveFilesCollection, driveFoldersCollection } from '@/apps/main/remote-sync/store';
import { beforeEach } from 'vitest';
import { updateDatabaseStatusToTrashed } from './update-database-status-to-trashed';

vi.mock(import('@/apps/main/remote-sync/store'))

describe('updateDatabaseStatusToTrashed', () => {
  const driveFilesCollectionUpdateInBatchMock = deepMocked(driveFilesCollection.updateInBatch);
  const driveFoldersCollectionUpdateInBatchMock = deepMocked(driveFoldersCollection.updateInBatch);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update file and folder statuses to TRASHED', async () => {
    await updateDatabaseStatusToTrashed([{ type: 'file', uuid: 'f-1' }], [{ type: 'folder', uuid: 'd-1' }]);

    expect(driveFilesCollectionUpdateInBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { status: 'TRASHED' },
        where: {
          uuid: expect.any(Object),
        },
      }),
    );

    expect(driveFoldersCollectionUpdateInBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { status: 'TRASHED' },
        where: {
          uuid: expect.any(Object),
        },
      }),
    );
  });
  it('should handle empty arrays without error', async () => {
    await updateDatabaseStatusToTrashed([], []);
    expect(driveFilesCollectionUpdateInBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { status: 'TRASHED' },
        where: {
          uuid: expect.any(Object),
        },
      }),
    );

    expect(driveFoldersCollectionUpdateInBatchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { status: 'TRASHED' },
        where: {
          uuid: expect.any(Object),
        },
      }),
    );
  });
});
