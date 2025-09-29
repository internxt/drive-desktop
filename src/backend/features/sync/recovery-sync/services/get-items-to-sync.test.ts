import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { getItemsToSync } from './get-items-to-sync';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('get-items-to-sync', () => {
  let props: Parameters<typeof getItemsToSync>[0];

  beforeEach(() => {
    props = mockProps<typeof getItemsToSync>({
      remotes: [{ uuid: 'uuid' as FileUuid, updatedAt: 'datetime' }],
      locals: [{ uuid: 'uuid' as FileUuid, updatedAt: 'datetime' }],
    });
  });

  it('should return file if not exists locally', () => {
    // Given
    props.locals = [];
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local file does not exist' }]);
  });

  it('should return file if has different updatedAt', () => {
    // Given
    props.locals[0].updatedAt = 'other';
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(1);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local file has a different updatedAt' }]);
  });

  it('should not return file if updatedAt and status are equal', () => {
    // When
    const res = getItemsToSync(props);
    // Then
    expect(res).toHaveLength(0);
    calls(loggerMock.error).toHaveLength(0);
  });
});
