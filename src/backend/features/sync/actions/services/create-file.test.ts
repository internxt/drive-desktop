import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import * as createAndUploadThumbnail from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { LocalSync } from '@/backend/features';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import * as handleEmptyFilesAmoutForUser from '@/backend/features/user/empty-files/handle-empty-files-amout-for-user';
import * as handleEmptyFilesNotAllowedForUser from '@/backend/features/user/empty-files/handle-empty-files-not-allowed-for-user';
import * as fileSizeLimit from '@/backend/features/user/file-size-limit';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFile } from './create-file';
import * as uploadFile from './upload-file';

describe('create-file', () => {
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const uploadMock = partialSpyOn(uploadFile, 'uploadFile');
  const persistMock = partialSpyOn(driveServerWip.files, 'createFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const handleFileUploadSizeExceededMock = partialSpyOn(fileSizeLimit, 'handleFileUploadSizeExceeded');
  const handleEmptyFilesAmoutForUserMock = partialSpyOn(handleEmptyFilesAmoutForUser, 'handleEmptyFilesAmoutForUser');
  const handleEmptyFilesNotAllowedForUserMock = partialSpyOn(handleEmptyFilesNotAllowedForUser, 'handleEmptyFilesNotAllowedForUser');
  const createAndUploadThumbnailMock = partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  const path = abs('/parent/file.txt');
  const size = 1024;
  let props: Parameters<typeof createFile>[0];

  beforeEach(() => {
    props = mockProps<typeof createFile>({ path });

    isTemporaryFileMock.mockReturnValue(false);
    uploadMock.mockResolvedValue({ contentsId: 'contentsId' as ContentsId, size });
  });

  it('should not upload if the file is temporary', async () => {
    // Given
    isTemporaryFileMock.mockReturnValue(true);
    // When
    await createFile(props);
    // Then
    calls(uploadMock).toHaveLength(0);
  });

  it('should not persist if the file upload fails', async () => {
    // Given
    uploadMock.mockResolvedValue(undefined);
    // When
    await createFile(props);
    // Then
    calls(persistMock).toHaveLength(0);
  });

  it('should add error if the file persistence fails', async () => {
    // Given
    persistMock.mockResolvedValue({ error: new Error() });
    // When
    await createFile(props);
    // Given
    call(addItemMock).toMatchObject({ action: 'UPLOAD_ERROR', path });
  });

  it('should handle file upload size exceeded if metadata persistence rejects file size', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'FILE_UPLOAD_SIZE_EXCEEDED' } });
    // When
    await createFile(props);
    // Given
    call(handleFileUploadSizeExceededMock).toMatchObject({ path, size });
    calls(addItemMock).toHaveLength(0);
  });

  it('should handle empty files not allowed if metadata persistence rejects empty files', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'EMPTY_FILES_NOT_ALLOWED' } });
    // When
    await createFile(props);
    // Then
    call(handleEmptyFilesNotAllowedForUserMock).toMatchObject({ path });
    calls(handleEmptyFilesAmoutForUserMock).toHaveLength(0);
    calls(addItemMock).toHaveLength(0);
  });

  it('should handle empty files amount exceeded if metadata persistence rejects empty files amount', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'EMPTY_FILES_EXCEEDED' } });
    // When
    await createFile(props);
    // Then
    call(handleEmptyFilesAmoutForUserMock).toMatchObject({ path });
    calls(handleEmptyFilesNotAllowedForUserMock).toHaveLength(0);
    calls(addItemMock).toHaveLength(0);
  });

  it('should create the file successfully', async () => {
    // Given
    persistMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await createFile(props);
    // Given
    call(uploadMock).toMatchObject({ path });
    call(persistMock).toMatchObject({ context: { path, body: { fileId: 'contentsId', size, plainName: 'file', type: 'txt' } } });
    call(addItemMock).toMatchObject({ action: 'UPLOADED', path });
    call(createAndUploadThumbnailMock).toMatchObject({ path, fileUuid: 'uuid' });
    call(createOrUpdateFileMock).toMatchObject({ fileDto: { uuid: 'uuid' } });
  });
});
