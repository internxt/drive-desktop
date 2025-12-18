import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateContentsId } from './update-contents-id';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as persistReplaceFile from '@/infra/drive-server-wip/out/ipc-main';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

describe('update-contents-id', () => {
  const persistReplaceFileMock = partialSpyOn(persistReplaceFile, 'persistReplaceFile');
  const contentsUploaderMock = partialSpyOn(EnvironmentFileUploader, 'run');
  const updateSyncStatusMock = partialSpyOn(Addon, 'updateSyncStatus');

  const path = abs('/folder/file.txt');
  const uuid = 'uuid' as FileUuid;

  let props: Parameters<typeof updateContentsId>[0];

  beforeEach(() => {
    contentsUploaderMock.mockResolvedValue('contentsId' as ContentsId);

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
    props.stats.size = SyncModule.MAX_FILE_SIZE + 1;
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
    expect(persistReplaceFileMock).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should update contents id', async () => {
    // Given
    persistReplaceFileMock.mockResolvedValue({ data: {} });
    // When
    await updateContentsId(props);
    // Then
    call(persistReplaceFileMock).toMatchObject({
      path: '/folder/file.txt',
      uuid,
      contentsId: 'contentsId',
      size: 1024,
      modificationTime: '2025-08-20T00:00:00.000Z',
    });
    call(updateSyncStatusMock).toMatchObject({ path });
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
