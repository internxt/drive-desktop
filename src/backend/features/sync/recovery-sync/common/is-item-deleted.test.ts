import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { isItemDeleted } from './is-item-deleted';

describe('is-item-deleted', () => {
  let props: Parameters<typeof isItemDeleted>[0];

  beforeEach(() => {
    props = mockProps<typeof isItemDeleted>({
      checkpointDate: new Date('2024-01-03'),
      local: { uuid: 'uuid' as FileUuid },
      remotesMap: new Map([['uuid' as FileUuid, { updatedAt: '2024-01-01' }]]),
    });
  });

  it('should return false is updatedAt is equal than checkpoint', () => {
    // Given
    props.local.updatedAt = '2024-01-03';
    // When
    const res = isItemDeleted(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should return false is updatedAt is greater than checkpoint', () => {
    // Given
    props.local.updatedAt = '2024-01-04';
    // When
    const res = isItemDeleted(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should return true if remote item does not exist', () => {
    // Given
    props.remotesMap = new Map();
    // When
    const res = isItemDeleted(props);
    // Then
    expect(res).toBe(true);
    calls(loggerMock.error).toMatchObject([{ msg: 'Remote item does not exist' }]);
  });

  it('should return false if updatedAt is equal', () => {
    // Given
    props.local.updatedAt = '2024-01-01';
    // When
    const res = isItemDeleted(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });
});
