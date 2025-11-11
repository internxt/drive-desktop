import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as storeModule from '../store';
import { broadcastToFrontend, getSortedItems } from './broadcast-to-frontend';
import * as broadcastToWidgetModule from '@/apps/main/windows';

describe('broadcast-to-frontend', () => {
  const clearStoreMock = partialSpyOn(storeModule, 'clearStore');
  const broadcastToWidgetMock = partialSpyOn(broadcastToWidgetModule, 'broadcastToWidget');

  const props = mockProps<typeof getSortedItems>([
    { path: 'path1', action: 'DELETE_ERROR' },
    { path: 'path2', action: 'UPLOAD_ERROR' },
    { path: 'path3', action: 'DELETED' },
    { path: 'path4', action: 'DOWNLOAD_CANCEL' },
    { path: 'path5', action: 'UPLOADED' },
    { path: 'path6', action: 'DOWNLOADING' },
    { path: 'path7', action: 'MOVED' },
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
      { action: 'DELETE_ERROR', path: 'path1' },
      { action: 'UPLOAD_ERROR', path: 'path2' },
      { action: 'DELETED', path: 'path3' },
      { action: 'MOVED', path: 'path7' },
      { action: 'DOWNLOAD_CANCEL', path: 'path4' },
    ]);
  });
});
