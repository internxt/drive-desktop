import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getItemsToSync } from './get-items-to-sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as isItemToSyncModule from './is-item-to-sync';

describe('get-items-to-sync', () => {
  const isItemToSyncMock = partialSpyOn(isItemToSyncModule, 'isItemToSync');

  let props: Parameters<typeof getItemsToSync>[0];

  beforeEach(() => {
    props = mockProps<typeof getItemsToSync>({
      checkpoint: {},
      remotes: [{ uuid: 'uuid' as FileUuid, updatedAt: 'datetime' }],
      locals: [],
    });
  });

  it('should return empty if item is synced', () => {
    // Given
    isItemToSyncMock.mockReturnValue(false);
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return remote if item is not synced', () => {
    // Given
    isItemToSyncMock.mockReturnValue(true);
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
  });
});
