import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { updateContentsId } from './update-contents-id';
import { mockDeep } from 'vitest-mock-extended';
import VirtualDrive from '@/node-win/virtual-drive';
import { InMemoryFileRepository } from '@/context/virtual-drive/files/infrastructure/InMemoryFileRepository';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FileMother } from '@/tests/context/virtual-drive/files/domain/FileMother';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';
import { ContentsUploader } from '@/context/virtual-drive/contents/application/ContentsUploader';

describe('update-contents-id', () => {
  const replaceFileSpy = partialSpyOn(driveServerWip.files, 'replaceFile');

  const virtualDrive = mockDeep<VirtualDrive>();
  const fileContentsUploader = mockDeep<ContentsUploader>();
  const repository = mockDeep<InMemoryFileRepository>();
  const path = createRelativePath('folder', 'file.txt');
  const uuid = 'uuid';

  let props: Parameters<typeof updateContentsId>[0];

  beforeEach(() => {
    vi.clearAllMocks();
    fileContentsUploader.run.mockResolvedValue({ id: 'newContentsId' as ContentsId, size: 1 });
    props = mockProps<typeof updateContentsId>({
      virtualDrive,
      fileContentsUploader,
      repository,
      path,
      uuid,
      stats: { size: 1024 },
    });
  });

  it('should not update contents id if file size is 0', async () => {
    // Given
    props.stats.size = 0;
    // When
    await updateContentsId(props);
    // Then
    expect(fileContentsUploader.run).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should not update contents id if file size is greater than MAX_SIZE', async () => {
    // Given
    props.stats.size = BucketEntry.MAX_SIZE + 1;
    // When
    await updateContentsId(props);
    // Then
    expect(fileContentsUploader.run).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should not update contents id if fileContentsUploader.run throws', async () => {
    // Given
    fileContentsUploader.run.mockRejectedValue(new Error());
    // When
    await updateContentsId(props);
    // Then
    expect(replaceFileSpy).toBeCalledTimes(0);
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should update contents id', async () => {
    // When
    await updateContentsId(props);
    // Then
    expect(replaceFileSpy).toBeCalledWith({ uuid, newContentId: 'newContentsId', newSize: 1 });
    expect(loggerMock.error).toBeCalledTimes(0);
  });

  it('should update repository', async () => {
    // Given
    const file = FileMother.any();
    repository.searchByPartial.mockReturnValue(file);
    // When
    await updateContentsId(props);
    // Then
    expect(repository.updateContentsAndSize).toBeCalledWith(file, 'newContentsId', 1);
    expect(loggerMock.error).toBeCalledTimes(0);
  });
});
