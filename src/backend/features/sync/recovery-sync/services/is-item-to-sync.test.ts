import { calls, mockProps } from '@/tests/vitest/utils.helper.test';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { isItemToSync } from './is-item-to-sync';

describe('is-item-to-sync', () => {
  let props: Parameters<typeof isItemToSync>[0];

  beforeEach(() => {
    props = mockProps<typeof isItemToSync>({
      checkpointDate: new Date('2024-01-03'),
      remote: { uuid: 'uuid' as FileUuid, updatedAt: '2024-01-01' },
      localsMap: new Map([['uuid' as FileUuid, { uuid: 'uuid' as FileUuid, updatedAt: '2024-01-01' }]]),
    });
  });

  it('should return false is updatedAt is equal than checkpoint', () => {
    // Given
    props.remote.updatedAt = '2024-01-03';
    // When
    const res = isItemToSync(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should return false is updatedAt is greater than checkpoint', () => {
    // Given
    props.remote.updatedAt = '2024-01-04';
    // When
    const res = isItemToSync(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });

  it('should return true if not exists locally', () => {
    // Given
    props.localsMap = new Map();
    // When
    const res = isItemToSync(props);
    // Then
    expect(res).toBe(true);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local item does not exist' }]);
  });

  it('should return true if has different updatedAt', () => {
    // Given
    props.remote.updatedAt = '2024-01-02';
    // When
    const res = isItemToSync(props);
    // Then
    expect(res).toBe(true);
    calls(loggerMock.error).toMatchObject([{ msg: 'Local item has a different updatedAt' }]);
  });

  it('should not return item if updatedAt is equal', () => {
    // When
    const res = isItemToSync(props);
    // Then
    expect(res).toBe(false);
    calls(loggerMock.error).toHaveLength(0);
  });
});
