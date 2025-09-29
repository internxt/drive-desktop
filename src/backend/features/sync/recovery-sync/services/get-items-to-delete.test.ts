import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { getItemsToDelete } from './get-items-to-delete';

describe('get-items-to-delete', () => {
  let props: Parameters<typeof getItemsToDelete>[0];

  beforeEach(() => {
    props = mockProps<typeof getItemsToDelete>({
      remotes: [{ uuid: 'uuid' as FileUuid }],
      locals: [{ uuid: 'uuid' as FileUuid }],
    });
  });

  it('should return file if not exists remotely', () => {
    // Given
    props.remotes = [];
    // When
    const res = getItemsToDelete(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Remote file does not exist' }]);
  });

  it('should not return file if updatedAt and status are equal', () => {
    // When
    const res = getItemsToDelete(props);
    // Then
    expect(res).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });
});
