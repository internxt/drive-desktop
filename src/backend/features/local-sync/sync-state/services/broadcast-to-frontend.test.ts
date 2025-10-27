import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as storeModule from '../store';
import { broadcastToFrontend, getSortedItems } from './broadcast-to-frontend';
import * as broadcastToWidgetModule from '@/apps/main/windows';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('broadcast-to-frontend', () => {
  const clearStoreMock = partialSpyOn(storeModule, 'clearStore');
  const broadcastToWidgetMock = partialSpyOn(broadcastToWidgetModule, 'broadcastToWidget');

  const props = mockProps<typeof getSortedItems>([
    { key: 'uuid1' as FileUuid, action: 'DELETE_ERROR' },
    { key: 'uuid2' as FileUuid, action: 'UPLOAD_ERROR' },
    { key: 'uuid3' as FileUuid, action: 'DELETED' },
    { key: 'uuid4' as FileUuid, action: 'DOWNLOAD_CANCEL' },
    { key: 'uuid5' as FileUuid, action: 'UPLOADED' },
    { key: 'uuid6' as FileUuid, action: 'DOWNLOADING' },
    { key: 'uuid7' as FileUuid, action: 'MOVED' },
  ]);

  it('should clear store when no items', () => {
    // When
    broadcastToFrontend();
    // Then
    calls(clearStoreMock).toHaveLength(1);
    call(broadcastToWidgetMock).toMatchObject({ name: 'sync-info-update', data: [] });
  });

  it('should return the first 5 items sorted by priority', () => {
    // When
    const res = getSortedItems(props);
    // Then
    expect(res).toMatchObject([
      { action: 'DELETE_ERROR', key: 'uuid1' },
      { action: 'UPLOAD_ERROR', key: 'uuid2' },
      { action: 'DELETED', key: 'uuid3' },
      { action: 'MOVED', key: 'uuid7' },
      { action: 'DOWNLOAD_CANCEL', key: 'uuid4' },
    ]);
  });
});
