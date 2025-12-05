import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { onAddDir } from './on-add-dir.service';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { moveFolder } from '@/backend/features/local-sync/watcher/events/rename-or-move/move-folder';
import * as trackAddFolderEvent from '@/backend/features/local-sync/watcher/events/unlink/is-move-event';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';

vi.mock(import('@/infra/node-win/node-win.module'));
vi.mock(import('@/backend/features/local-sync/watcher/events/rename-or-move/move-folder'));

describe('on-add-dir', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const moveFolderMock = vi.mocked(moveFolder);
  const createFolderMock = partialSpyOn(FolderCreator, 'run');
  const trackAddFolderEventMock = partialSpyOn(trackAddFolderEvent, 'trackAddFolderEvent');

  let props: Parameters<typeof onAddDir>[0];

  beforeEach(() => {
    props = mockProps<typeof onAddDir>({ path: abs('/folder') });
  });

  it('should call add controller if the folder is new', async () => {
    // Given
    getFolderInfoMock.mockResolvedValueOnce({ data: undefined });
    // When
    await onAddDir(props);
    // Then
    expect(createFolderMock).toBeCalledWith(expect.objectContaining({ path: '/folder' }));
  });

  it('should call moveFolder if the folder is moved', async () => {
    // Given
    getFolderInfoMock.mockResolvedValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await onAddDir(props);
    // Then
    expect(trackAddFolderEventMock).toBeCalledWith({ uuid: 'uuid' });
    expect(moveFolderMock).toBeCalledWith(expect.objectContaining({ path: '/folder', uuid: 'uuid' }));
  });
});
