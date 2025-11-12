import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { onAddDir } from './on-add-dir.service';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import * as createFolder from '@/features/sync/add-item/create-folder';
import * as trackAddFolderEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-folder'));

describe('on-add-dir', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const moveFolderMock = vi.mocked(moveFolder);
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');
  const trackAddFolderEventMock = partialSpyOn(trackAddFolderEvent, 'trackAddFolderEvent');

  let props: Parameters<typeof onAddDir>[0];

  beforeEach(() => {
    props = mockProps<typeof onAddDir>({
      ctx: { virtualDrive: { syncRootPath: 'C:/Users/user' as AbsolutePath } },
      path: 'C:/Users/user/drive/folder' as AbsolutePath,
    });
  });

  it('should call add controller if the folder is new', async () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: undefined });
    // When
    await onAddDir(props);
    // Then
    expect(createFolderMock).toBeCalledWith(
      expect.objectContaining({
        path: '/drive/folder',
      }),
    );
  });

  it('should call moveFolder if the folder is moved', async () => {
    // Given
    getFolderInfoMock.mockReturnValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await onAddDir(props);
    // Then
    expect(trackAddFolderEventMock).toBeCalledWith({ uuid: 'uuid' });
    expect(moveFolderMock).toBeCalledWith(
      expect.objectContaining({
        path: 'C:/Users/user/drive/folder',
        uuid: 'uuid',
      }),
    );
  });
});
