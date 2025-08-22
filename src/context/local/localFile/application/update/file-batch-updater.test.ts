import { FileBatchUpdater } from './FileBatchUpdater';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as uploadFile from '../upload-file';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('file-batch-updater', () => {
  const uploadFileMock = partialSpyOn(uploadFile, 'uploadFile');
  const replaceFileMock = partialSpyOn(driveServerWip.files, 'replaceFile');

  let props: Parameters<typeof FileBatchUpdater.process>[0];

  beforeEach(() => {
    props = mockProps<typeof FileBatchUpdater.process>({
      self: { backed: 0 },
      tracker: { currentProcessed: vi.fn() },
      file: { uuid: 'uuid' as FileUuid },
      localFile: { size: { value: 1024 }, modificationTime: new Date('2025-08-20T00:00:00.000Z') },
    });
  });

  it('should increase backed if content is not updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue(undefined);
    // When
    await FileBatchUpdater.process(props);
    // Then
    expect(replaceFileMock).toBeCalledTimes(0);
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if content is updated', async () => {
    // Given
    uploadFileMock.mockResolvedValue('contentsId' as ContentsId);
    // When
    await FileBatchUpdater.process(props);
    // Then
    expect(replaceFileMock).toBeCalledWith({
      uuid: 'uuid',
      newContentId: 'contentsId',
      newSize: 1024,
      modificationTime: '2025-08-20T00:00:00.000Z',
    });
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
  });

  it('should increase backed if there is an error', async () => {
    // Given
    uploadFileMock.mockRejectedValue(new Error());
    // When
    await FileBatchUpdater.process(props);
    // Then
    expect(props.self.backed).toBe(1);
    expect(props.tracker.currentProcessed).toBeCalledTimes(1);
    expect(loggerMock.error).toBeCalledTimes(1);
  });
});
