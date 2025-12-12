import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { needsToBeMoved } from './needs-to-be-moved';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('needs-to-be-moved', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const remotePath = abs('/drive/folder1/current');
  const localPath = abs('/drive/folder2/current');

  let props: Parameters<typeof needsToBeMoved>[0];

  beforeEach(() => {
    props = mockProps<typeof needsToBeMoved>({
      remote: { absolutePath: remotePath },
      localPath,
    });
  });

  it('should return false if path is the same', async () => {
    // Given
    props.remote.absolutePath = props.localPath;
    // When
    const hasBeenMoved = await needsToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if local parent does not exist', async () => {
    // Given
    props.remote.parentUuid = 'uuid' as FolderUuid;
    getFolderInfoMock.mockResolvedValue({});
    // When
    const hasBeenMoved = await needsToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return false if both parents have the same uuid', async () => {
    // Given
    props.remote.parentUuid = 'uuid' as FolderUuid;
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    const hasBeenMoved = await needsToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if both parents have different uuid', async () => {
    // Given
    props.remote.parentUuid = 'uuid1' as FolderUuid;
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid2' as FolderUuid } });
    // When
    const hasBeenMoved = await needsToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if item has been renamed but not moved', async () => {
    // Given
    props.remote.absolutePath = abs('/drive/folder/old');
    props.localPath = abs('/drive/folder/new');
    // When
    const hasBeenMoved = await needsToBeMoved(props);
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
  it('should return false if item has been renamed but both parents have the same uuid', async () => {
    // Given
    props.remote.absolutePath = abs('/drive/folder1/folder2/old');
    props.localPath = abs('/drive/folder3/folder2/new');
    props.remote.parentUuid = 'uuid' as FolderUuid;
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    const hasBeenMoved = await needsToBeMoved(props);
    // Then
    expect(hasBeenMoved).toBe(false);
  });
});
