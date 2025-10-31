import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { hasToBeMoved } from './has-to-be-moved';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('has-to-be-moved', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const remotePath = 'C:\\Users\\user\\InternxtDrive\\folder1\\current' as AbsolutePath;
  const localPath = 'C:\\Users\\user\\InternxtDrive\\folder2\\current' as AbsolutePath;

  let props: Parameters<typeof hasToBeMoved>[0];

  beforeEach(() => {
    props = mockProps<typeof hasToBeMoved>({ remotePath, localPath });
  });

  it('should return false if path is the same', () => {
    // Given
    props.remotePath = props.localPath;
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if local parent does not exist', () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({});
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if remote parent does not exist', () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    getFolderInfoMock.mockReturnValueOnce({});
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if both parents have the same uuid', () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if both parents have different uuid', () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid1' as FolderUuid } });
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid2' as FolderUuid } });
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if item has been renamed but not moved', () => {
    // Given
    props.remotePath = 'C:\\Users\\user\\InternxtDrive\\folder\\old' as AbsolutePath;
    props.localPath = 'C:\\Users\\user\\InternxtDrive\\folder\\new' as AbsolutePath;
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  /**
   * v2.5.6 Daniel Jiménez
   * This is a use case that we cannot handle right now. Basically we cannot rename
   * an item if the move event is in another folder because we cannot move an inner
   * item. What will happen is that in the first sync iteration we will call move from
   * folder1 to folder3 and in the second sync iteration now the path will be the same
   * so we will rename the inner folder.
   */
  it('should return false if item has been renamed but both parents have the same uuid', () => {
    // Given
    props.remotePath = 'C:\\Users\\user\\InternxtDrive\\folder1\\folder2\\old' as AbsolutePath;
    props.localPath = 'C:\\Users\\user\\InternxtDrive\\folder3\\folder2\\new' as AbsolutePath;
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    const hasBeenMoved = hasToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });
});
