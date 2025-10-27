import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getItemsToSync } from './get-items-to-sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { CheckpointsModule } from '@/infra/lokijs/databases/checkpoints/checkpoints.module';
import * as isItemToSyncModule from './is-item-to-sync';

describe('get-items-to-sync', () => {
  const getCheckpointMock = partialSpyOn(CheckpointsModule, 'getCheckpoint');
  const isItemToSyncMock = partialSpyOn(isItemToSyncModule, 'isItemToSync');

  let props: Parameters<typeof getItemsToSync>[0];

  beforeEach(() => {
    getCheckpointMock.mockResolvedValue({ data: 'datetime' });

    props = mockProps<typeof getItemsToSync>({
      remotes: [{ uuid: 'uuid' as FileUuid, updatedAt: 'datetime' }],
      locals: [],
    });
  });

  it('should return empty if there is no checkpoint', async () => {
    // Given
    getCheckpointMock.mockResolvedValue({ data: undefined });
    // When
    const res = await getItemsToSync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return empty if it is not item to sync', async () => {
    // Given
    isItemToSyncMock.mockReturnValue(false);
    // When
    const res = await getItemsToSync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return remote if it is item to sync', async () => {
    // Given
    isItemToSyncMock.mockReturnValue(true);
    // When
    const res = await getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
  });
});
