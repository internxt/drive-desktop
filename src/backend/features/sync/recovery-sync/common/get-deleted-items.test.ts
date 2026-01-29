import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { getDeletedItems } from './get-deleted-items';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as isItemDeletedModule from './is-item-deleted';

describe('get-deleted-items', () => {
  const isItemDeletedMock = partialSpyOn(isItemDeletedModule, 'isItemDeleted');

  let props: Parameters<typeof getDeletedItems>[0];

  beforeEach(() => {
    props = mockProps<typeof getDeletedItems>({
      checkpoint: {},
      remotes: [],
      locals: [{ uuid: 'uuid' as FileUuid, updatedAt: 'datetime' }],
    });
  });

  it('should return empty if item is not deleted', () => {
    // Given
    isItemDeletedMock.mockReturnValue(false);
    // When
    const res = getDeletedItems(props);
    // Then
    expect(res).toHaveLength(0);
  });

  it('should return local if item is deleted', () => {
    // Given
    isItemDeletedMock.mockReturnValue(true);
    // When
    const res = getDeletedItems(props);
    // Then
    expect(res).toHaveLength(1);
  });
});
