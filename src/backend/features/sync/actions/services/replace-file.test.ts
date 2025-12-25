import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { replaceFile } from './replace-file';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { LocalSync } from '@/backend/features';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as uploadFile from './upload-file';
import * as createAndUploadThumbnail from '@/apps/main/thumbnail/create-and-upload-thumbnail';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('replace-file', () => {
  const uploadMock = partialSpyOn(uploadFile, 'uploadFile');
  const persistMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const createAndUploadThumbnailMock = partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  const path = abs('/file.txt');
  const size = 1024;
  const mtime = new Date('2000-01-01');
  let props: Parameters<typeof replaceFile>[0];

  beforeEach(() => {
    props = mockProps<typeof replaceFile>({ path, stats: { size, mtime } });

    uploadMock.mockResolvedValue('contentsId' as ContentsId);
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

  it('should replace the file successfully', async () => {
    // Given
    persistMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    // When
    await replaceFile(props);
    // Given
    call(uploadMock).toMatchObject({ path, size });
    call(persistMock).toMatchObject({ context: { path, contentsId: 'contentsId', size, modificationTime: '2000-01-01T00:00:00.000Z' } });
    call(addItemMock).toMatchObject({ action: 'MODIFIED', path });
    call(createAndUploadThumbnailMock).toMatchObject({ path, fileUuid: 'uuid' });
    call(createOrUpdateFileMock).toMatchObject({ fileDto: { uuid: 'uuid' } });
  });
});
