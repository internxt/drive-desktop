import { mockDeep } from 'vitest-mock-extended';
import { FileBatchUpdater } from './FileBatchUpdater';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from '../upload-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('file-batch-updater', () => {
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const replaceFileMock = partialSpyOn(driveServerWip.files, 'replaceFile');
  const uploader = mockDeep<EnvironmentFileUploader>();
  const service = new FileBatchUpdater(uploader);

  let props: Parameters<typeof service.process>[0];

  beforeEach(() => {
    props = mockProps<typeof service.process>({
      self: { backed: 0 },
      tracker: { currentProcessed: vi.fn() },
      file: { uuid: 'uuid' as FileUuid },
      localFile: { size: { value: 1024 } },
    });
  });

  it('should increase backed if content is not updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue(undefined);
    // When
    await service.process(props);
    // Then
    expect(replaceFileMock).toBeCalledTimes(0);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if content is updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    await service.process(props);
    // Then
    expect(replaceFileMock).toBeCalledWith({ uuid: 'uuid', newContentId: 'contentsId', newSize: 1024 });
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error());
    // When
    await service.process(props);
    // Then
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
