import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from '../upload-file';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as createAndUploadThumbnail from '@/apps/main/thumbnails/application/create-and-upload-thumbnail';
import { HttpRemoteFileSystem } from '@/context/virtual-drive/files/infrastructure/HttpRemoteFileSystem';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { createFiles } from './FileBatchUploader';
import { abs, dirname } from '../../infrastructure/AbsolutePath';

describe('create-files', () => {
  partialSpyOn(createAndUploadThumbnail, 'createAndUploadThumbnail');
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const persistMock = partialSpyOn(HttpRemoteFileSystem, 'persist');

  let props: Parameters<typeof createFiles>[0];

  const path = abs('/folder1/folder2/file.txt');
  const parentPath = dirname(path);

  beforeEach(() => {
    props = mockProps<typeof createFiles>({
      self: { backed: 0 },
      context: { backupsBucket: 'bucket' },
      tracker: { currentProcessed: vi.fn() },
      remoteTree: { folders: new Map([[parentPath, { uuid: 'parentUuid' as FolderUuid }]]) },
      added: [{ absolutePath: path, size: 1024 }],
    });
  });

  it('should increase backed if content is not updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue(undefined);
    // When
    await createFiles(props);
    // Then
    expect(persistMock).toBeCalledTimes(0);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if content is updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    await createFiles(props);
    // Then
    expect(persistMock).toBeCalledWith(expect.objectContaining({ parentUuid: 'parentUuid', path, contentsId: 'contentsId', size: 1024 }));
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error());
    // When
    await createFiles(props);
    // Then
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
