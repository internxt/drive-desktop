import { mockProps } from '@/tests/vitest/utils.helper.test';
import { isModified } from './is-modified';
import { PinState } from '@/node-win/types/placeholder.type';
import { v4 } from 'uuid';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('is-modified', () => {
  const uuid = v4() as FileUuid;
  let props: Parameters<typeof isModified>[0];

  beforeEach(() => {
    props = mockProps<typeof isModified>({
      pinState: PinState.AlwaysLocal,
      localFile: { uuid, stats: { size: 1000, mtime: new Date('2000-01-02T00:00:00.000Z') } },
      remoteFilesMap: {
        [uuid]: { size: 1500, updatedAt: '2000-01-01T00:00:00.000Z' },
      },
    });
  });

  it('should not update if remote file is not found', () => {
    // Given
    props.remoteFilesMap = {};
    // When
    const res = isModified(props);
    // Then
    expect(res).toBe(false);
  });

  it('should not update if sizes are equal', () => {
    // Given
    props.remoteFilesMap[uuid].size = 1000;
    // When
    const res = isModified(props);
    // Then
    expect(res).toBe(false);
  });

  it('should not update if local is not hydrated', () => {
    // Given
    props.pinState = PinState.OnlineOnly;
    // When
    const res = isModified(props);
    // Then
    expect(res).toBe(false);
  });

  it('should not update if remote is newer', () => {
    // Given
    props.remoteFilesMap[uuid].updatedAt = '2000-01-03T00:00:00.000Z';
    // When
    const res = isModified(props);
    // Then
    expect(res).toBe(false);
  });

  it('should update', () => {
    // When
    const res = isModified(props);
    // Then
    expect(res).toBe(true);
  });
});
