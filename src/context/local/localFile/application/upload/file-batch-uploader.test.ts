import { mockDeep } from 'vitest-mock-extended';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from '../upload-file';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { FileBatchUploader } from './FileBatchUploader';
import { SimpleFileCreator } from '@/context/virtual-drive/files/application/create/SimpleFileCreator';
import { createRelativePath, pathUtils } from '../../infrastructure/AbsolutePath';
import * as onFileCreated from '@/apps/main/on-file-created';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('file-batch-uploader', () => {
  partialSpyOn(onFileCreated, 'onFileCreated');
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const uploader = mockDeep<EnvironmentFileUploader>();
  const creator = mockDeep<SimpleFileCreator>();
  const service = new FileBatchUploader(uploader, creator);

  let props: Parameters<typeof service.run>[0];

  const path = createRelativePath('folder1', 'folder2', 'file.txt');
  const parentPath = pathUtils.dirname(path);

  beforeEach(() => {
    vi.clearAllMocks();

    props = mockProps<typeof service.run>({
      self: { backed: 0 },
      tracker: { currentProcessed: vi.fn() },
      remoteTree: { folders: { [parentPath]: { uuid: 'parentUuid' } } },
      added: [{ relativePath: path, size: { value: 1024 } }],
    });
  });

  it('should increase backed if content is not updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue(undefined);
    // When
    await service.run(props);
    // Then
    expect(creator.run).toBeCalledTimes(0);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if content is updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    await service.run(props);
    // Then
    expect(creator.run).toBeCalledWith({ folderUuid: 'parentUuid', path, contentsId: 'contentsId', size: 1024 });
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error());
    // When
    await service.run(props);
    // Then
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
