import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { getDeletedItems } from './get-deleted-items';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('get-deleted-items', () => {
  let props: Parameters<typeof getDeletedItems>[0];

  beforeEach(() => {
    props = mockProps<typeof getDeletedItems>({
      remotes: [{ uuid: 'uuid' as FileUuid }],
      locals: [{ uuid: 'uuid' as FileUuid }],
    });
  });

  it('should return item if not exists remotely', () => {
    // Given
    props.remotes = [];
    // When
    const res = getDeletedItems(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Remote item does not exist' }]);
  });

  it('should not return item if updatedAt and status are equal', () => {
    // When
    const res = getDeletedItems(props);
    // Then
    expect(res).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });
});
