import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { unlinkFile } from './unlink-file';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as isMoveEvent from './is-move-event';
import * as deleteFileByUuid from '@/infra/drive-server-wip/out/ipc-main';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('unlink-file', () => {
  const deleteFileByUuidMock = partialSpyOn(deleteFileByUuid, 'deleteFileByUuid');
  const isMoveEventMock = partialSpyOn(isMoveEvent, 'isMoveEvent');

  const props = mockProps<typeof unlinkFile>({
    path: abs('/parent/file.txt'),
    uuid: 'uuid' as FileUuid,
  });

  beforeEach(() => {
    isMoveEventMock.mockResolvedValue(false);
  });

  it('should skip if it is a move event', async () => {
    // Given
    isMoveEventMock.mockResolvedValue(true);
    // When
    await unlinkFile(props);
    // Then
    call(isMoveEventMock).toMatchObject({ uuid: 'uuid' });
  });

  it('should unlink file if it is not a move event', async () => {
    // Given
    isMoveEventMock.mockResolvedValue(false);
    // When
    await unlinkFile(props);
    // Then
    call(deleteFileByUuidMock).toMatchObject({ path: '/parent/file.txt', uuid: 'uuid' });
  });
});
