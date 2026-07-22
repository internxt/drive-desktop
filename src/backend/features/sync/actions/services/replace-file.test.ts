import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as createAndUploadThumbnail from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import { LocalSync } from '@/backend/features';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import * as handleEmptyFilesAmoutForUser from '@/backend/features/user/empty-files/handle-empty-files-amout-for-user';
import * as handleEmptyFilesNotAllowedForUser from '@/backend/features/user/empty-files/handle-empty-files-not-allowed-for-user';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as handleFileUploadSizeExceeded from '../../../user/file-size-limit/handle-file-upload-size-exceeded';
import { replaceFile } from './replace-file';
import * as uploadFile from './upload-file';

describe('replace-file', () => {
  const uploadMock = partialSpyOn(uploadFile, 'uploadFile');
  const persistMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const handleFileUploadSizeExceededMock = partialSpyOn(handleFileUploadSizeExceeded, 'handleFileUploadSizeExceeded');
  const handleEmptyFilesAmoutForUserMock = partialSpyOn(handleEmptyFilesAmoutForUser, 'handleEmptyFilesAmoutForUser');
  const handleEmptyFilesNotAllowedForUserMock = partialSpyOn(handleEmptyFilesNotAllowedForUser, 'handleEmptyFilesNotAllowedForUser');
  const createAndUploadThumbnailMock = partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  const path = abs('/file.txt');
  const size = 1024;
  const mtime = new Date('2000-01-01T00:00:00.000Z');
  const creationTime = new Date('1999-01-01T00:00:00.000Z');
  let props: Parameters<typeof replaceFile>[0];

  beforeEach(() => {
    props = mockProps<typeof replaceFile>({ path });

    uploadMock.mockResolvedValue({ contentsId: 'contentsId' as ContentsId, size, mtime, creationTime });
  });

  it('should not persist if the file upload fails', async () => {
    // Given
    uploadMock.mockResolvedValue(undefined);
    // When
    await replaceFile(props);
    // Then
    calls(persistMock).toHaveLength(0);
  });

  it('should add error if the file persistence fails', async () => {
    // Given
    persistMock.mockResolvedValue({ error: new Error() });
    // When
    await replaceFile(props);
    // Given
    call(addItemMock).toMatchObject({ action: 'MODIFY_ERROR', path });
  });

  it('should handle file upload size exceeded if metadata replacement rejects file size', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'FILE_UPLOAD_SIZE_EXCEEDED' } });
    // When
    await replaceFile(props);
    // Given
    call(handleFileUploadSizeExceededMock).toMatchObject({ path, size });
    calls(addItemMock).toHaveLength(0);
  });

  it('should handle empty files not allowed if metadata replacement rejects empty files', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'EMPTY_FILES_NOT_ALLOWED' } });
    // When
    await replaceFile(props);
    // Then
    call(handleEmptyFilesNotAllowedForUserMock).toMatchObject({ path });
    calls(handleEmptyFilesAmoutForUserMock).toHaveLength(0);
    calls(addItemMock).toHaveLength(0);
  });

  it('should handle empty files amount exceeded if metadata replacement rejects empty files amount', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'EMPTY_FILES_EXCEEDED' } });
    // When
    await replaceFile(props);
    // Then
    call(handleEmptyFilesAmoutForUserMock).toMatchObject({ path });
    calls(handleEmptyFilesNotAllowedForUserMock).toHaveLength(0);
    calls(addItemMock).toHaveLength(0);
  });

  it('should replace the file successfully', async () => {
    // Given
    persistMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await replaceFile(props);
    // Given
    call(uploadMock).toMatchObject({ path });
    call(persistMock).toMatchObject({
      context: {
        path,
        contentsId: 'contentsId',
        size,
        modificationTime: '2000-01-01T00:00:00.000Z',
        creationTime: '1999-01-01T00:00:00.000Z',
      },
    });
    call(addItemMock).toMatchObject({ action: 'MODIFIED', path });
    call(createAndUploadThumbnailMock).toMatchObject({ path, fileUuid: 'uuid' });
    call(createOrUpdateFileMock).toMatchObject({ fileDto: { uuid: 'uuid' } });
  });
});
