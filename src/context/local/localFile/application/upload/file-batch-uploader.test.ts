import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from '../upload-file';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { FileBatchUploader } from './FileBatchUploader';
import { createRelativePath, pathUtils } from '../../infrastructure/AbsolutePath';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as createAndUploadThumbnail from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as createOrUpdateFile from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-file';

describe('file-batch-uploader', () => {
  partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const createMock = partialSpyOn(HttpRemoteFileSystem, 'create');
  const createOrUpdateFileMock = partialSpyOn(createOrUpdateFile, 'createOrUpdateFile');

  let props: Parameters<typeof FileBatchUploader.run>[0];

  const path = createRelativePath('folder1', 'folder2', 'file.txt');
  const parentPath = pathUtils.dirname(path);

  beforeEach(() => {
    props = mockProps<typeof FileBatchUploader.run>({
      self: { backed: 0 },
      context: { backupsBucket: 'bucket' },
      tracker: { currentProcessed: vi.fn() },
      remoteTree: { folders: { [parentPath]: { uuid: 'parentUuid' as FolderUuid } } },
      added: [{ relativePath: path, size: 1024 }],
    });
  });

  it('should increase backed if content is not updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue(undefined);
    // When
    await FileBatchUploader.run(props);
    // Then
    expect(createMock).toBeCalledTimes(0);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if content is updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    await FileBatchUploader.run(props);
    // Then
    expect(createMock).toBeCalledWith(expect.objectContaining({ folderUuid: 'parentUuid', path, contentsId: 'contentsId', size: 1024 }));
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(createOrUpdateFileMock).toBeCalledTimes(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error());
    // When
    await FileBatchUploader.run(props);
    // Then
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
