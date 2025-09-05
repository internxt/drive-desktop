import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateContentsId } from './update-contents-id';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';
import * as updateFileStatus from '@/backend/features/local-sync/placeholders/update-file-status';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';

describe('update-contents-id', () => {
  const replaceFileMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const updateFileStatusMock = partialSpyOn(updateFileStatus, 'updateFileStatus');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');
  const contentsUploaderMock = partialSpyOn(ContentsUploader, 'run');

  const path = createRelativePath('folder', 'file.txt');
  const uuid = 'uuid';

  let props: Parameters<typeof updateContentsId>[0];

  beforeEach(() => {
    contentsUploaderMock.mockResolvedValue({ id: 'newContentsId' as ContentsId, size: 1 });
    props = mockProps<typeof updateContentsId>({
      path,
      uuid,
      stats: { size: 1024, mtime: new Date('2025-08-20T00:00:00.000Z') },
    });
  });

  it('should not update contents id if file size is 0', async () => {
    // Given
    props.stats.size = 0;
    // When
    await updateContentsId(props);
    // Then
    expect(contentsUploaderMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should not update contents id if file size is greater than MAX_SIZE', async () => {
    // Given
    props.stats.size = BucketEntry.MAX_SIZE + 1;
    // When
    await updateContentsId(props);
    // Then
    expect(contentsUploaderMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should not update contents id if contentsUploader throws', async () => {
    // Given
    contentsUploaderMock.mockRejectedValue(new Error());
    // When
    await updateContentsId(props);
    // Then
    expect(replaceFileMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should update contents id', async () => {
    // Given
    replaceFileMock.mockResolvedValue({ data: {} });
    // When
    await updateContentsId(props);
    // Then
    expect(replaceFileMock).toBeCalledWith({
      uuid,
      newContentId: 'newContentsId',
      newSize: 1,
      modificationTime: '2025-08-20T00:00:00.000Z',
    });
    expect(updateFileStatusMock).toBeCalledWith({ path });
    expect(invokeMock).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
