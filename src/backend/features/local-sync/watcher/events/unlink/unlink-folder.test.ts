import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFolder } from './unlink-folder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as isMoveEvent from './is-move-event';
import * as deleteFolderByUuid from '@/infra/drive-server-wip/out/ipc-main';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('unlink-folder', () => {
  const deleteFolderByUuidMock = partialSpyOn(deleteFolderByUuid, 'deleteFolderByUuid');
  const isMoveEventMock = partialSpyOn(isMoveEvent, 'isMoveEvent');

  const props = mockProps<typeof unlinkFolder>({
    path: abs('/parent/folder'),
    uuid: 'uuid' as FolderUuid,
  });

  beforeEach(() => {
    isMoveEventMock.mockResolvedValue(false);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveEventMock.mockResolvedValue(true);
    // When
    await unlinkFolder(props);
    // Then
    call(isMoveEventMock).toMatchObject({ uuid: 'uuid' });
  });

  it('should unlink folder if it is not a move event', async () => {
    // Given
    isMoveEventMock.mockResolvedValue(false);
    // When
    await unlinkFolder(props);
    // Then
    call(deleteFolderByUuidMock).toMatchObject({ path: '/parent/folder', uuid: 'uuid' });
  });
});
