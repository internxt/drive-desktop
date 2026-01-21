import { UploadOnRename } from './UploadOnRename';
import { ContainerMock } from '../../__mocks__/ContainerMock';
import { FirstsFileSearcher } from '../../../../context/virtual-drive/files/application/search/FirstsFileSearcher';
import { TemporalFileByPathFinder } from '../../../../context/storage/TemporalFiles/application/find/TemporalFileByPathFinder';
import { TemporalFileUploader } from '../../../../context/storage/TemporalFiles/application/upload/TemporalFileUploader';
import { TemporalFileDeleter } from '../../../../context/storage/TemporalFiles/application/deletion/TemporalFileDeleter';
import { RelativePathToAbsoluteConverter } from '../../../../context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { TemporalFileByteByByteComparator } from '../../../../context/storage/TemporalFiles/application/comparation/TemporalFileByteByByteComparator';
import { FileMother } from '../../../../context/virtual-drive/files/domain/__test-helpers__/FileMother';
import { BucketEntryIdMother } from '../../../../context/virtual-drive/shared/domain/__test-helpers__/BucketEntryIdMother';
import { TemporalFile } from '../../../../context/storage/TemporalFiles/domain/TemporalFile';
import { TemporalFilePath } from '../../../../context/storage/TemporalFiles/domain/TemporalFilePath';
import { TemporalFileSize } from '../../../../context/storage/TemporalFiles/domain/TemporalFileSize';
import { calls, call } from 'tests/vitest/utils.helper';
import { FileStatuses } from '../../../../context/virtual-drive/files/domain/FileStatus';

describe('UploadOnRename', () => {
  let container: ContainerMock;
  let uploadOnRename: UploadOnRename;

  const firstsFileSearcherMock = { run: vi.fn() };
  const temporalFileByPathFinderMock = { run: vi.fn() };
  const temporalFileUploaderMock = { run: vi.fn() };
  const temporalFileDeleterMock = { run: vi.fn() };
  const relativePathToAbsoluteConverterMock = { run: vi.fn() };
  const temporalFileByteByByteComparatorMock = { run: vi.fn() };

  const src = '/tmp/offline-file.txt';
  const dest = '/virtual/file.txt';

  beforeEach(() => {
    container = new ContainerMock();
    uploadOnRename = new UploadOnRename(container);

    container.set(FirstsFileSearcher, firstsFileSearcherMock);
    container.set(TemporalFileByPathFinder, temporalFileByPathFinderMock);
    container.set(TemporalFileUploader, temporalFileUploaderMock);
    container.set(TemporalFileDeleter, temporalFileDeleterMock);
    container.set(RelativePathToAbsoluteConverter, relativePathToAbsoluteConverterMock);
    container.set(TemporalFileByteByByteComparator, temporalFileByteByByteComparatorMock);
  });

  it('should return no-op when file to override is not found', async () => {
    firstsFileSearcherMock.run.mockResolvedValue(null);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('no-op');
    call(firstsFileSearcherMock.run).toMatchObject({
      path: dest,
      status: FileStatuses.EXISTS,
    });
    calls(temporalFileByPathFinderMock.run).toHaveLength(0);
  });

  it('should return no-op when temporal file is not found', async () => {
    const virtualFile = FileMother.fromPartial({ path: dest });
    firstsFileSearcherMock.run.mockResolvedValue(virtualFile);
    temporalFileByPathFinderMock.run.mockResolvedValue(null);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('no-op');
    call(firstsFileSearcherMock.run).toMatchObject({
      path: dest,
      status: FileStatuses.EXISTS,
    });
    call(temporalFileByPathFinderMock.run).toBe(src);
    calls(temporalFileUploaderMock.run).toHaveLength(0);
  });

  it('should delete temporal file and return success when files do not differ', async () => {
    const contentsId = BucketEntryIdMother.primitive();
    const virtualFile = FileMother.fromPartial({
      path: dest,
      size: 1024,
      contentsId,
    });
    const temporalFile = TemporalFile.create(new TemporalFilePath(src), new TemporalFileSize(1024));

    firstsFileSearcherMock.run.mockResolvedValue(virtualFile);
    temporalFileByPathFinderMock.run.mockResolvedValue(temporalFile);
    relativePathToAbsoluteConverterMock.run.mockReturnValue('/absolute/path/to/file');
    temporalFileByteByByteComparatorMock.run.mockResolvedValue(true);
    temporalFileDeleterMock.run.mockResolvedValue(undefined);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('success');
    call(relativePathToAbsoluteConverterMock.run).toBe(contentsId);
    calls(temporalFileByteByByteComparatorMock.run).toHaveLength(1);
    call(temporalFileDeleterMock.run).toBe(src);
    calls(temporalFileUploaderMock.run).toHaveLength(0);
  });

  it('should upload and delete temporal file when files differ in size', async () => {
    const contentsId = BucketEntryIdMother.primitive();
    const virtualFile = FileMother.fromPartial({
      path: dest,
      size: 1024,
      contentsId,
    });
    const temporalFile = TemporalFile.create(new TemporalFilePath(src), new TemporalFileSize(2048));

    firstsFileSearcherMock.run.mockResolvedValue(virtualFile);
    temporalFileByPathFinderMock.run.mockResolvedValue(temporalFile);
    temporalFileUploaderMock.run.mockResolvedValue(undefined);
    temporalFileDeleterMock.run.mockResolvedValue(undefined);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('success');
    call(temporalFileUploaderMock.run).toMatchObject([src, { contentsId }]);
    call(temporalFileDeleterMock.run).toBe(src);
  });

  it('should upload and delete temporal file when files differ in content', async () => {
    const contentsId = BucketEntryIdMother.primitive();
    const virtualFile = FileMother.fromPartial({
      path: dest,
      size: 1024,
      contentsId,
    });
    const temporalFile = TemporalFile.create(new TemporalFilePath(src), new TemporalFileSize(1024));

    firstsFileSearcherMock.run.mockResolvedValue(virtualFile);
    temporalFileByPathFinderMock.run.mockResolvedValue(temporalFile);
    relativePathToAbsoluteConverterMock.run.mockReturnValue('/absolute/path/to/file');
    temporalFileByteByByteComparatorMock.run.mockResolvedValue(false);
    temporalFileUploaderMock.run.mockResolvedValue(undefined);
    temporalFileDeleterMock.run.mockResolvedValue(undefined);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('success');
    call(relativePathToAbsoluteConverterMock.run).toBe(contentsId);
    calls(temporalFileByteByByteComparatorMock.run).toHaveLength(1);
    call(temporalFileUploaderMock.run).toMatchObject([src, { contentsId }]);
    call(temporalFileDeleterMock.run).toBe(src);
  });

  it('should handle comparison errors and proceed with upload', async () => {
    const contentsId = BucketEntryIdMother.primitive();
    const virtualFile = FileMother.fromPartial({
      path: dest,
      size: 1024,
      contentsId,
    });
    const temporalFile = TemporalFile.create(new TemporalFilePath(src), new TemporalFileSize(1024));

    firstsFileSearcherMock.run.mockResolvedValue(virtualFile);
    temporalFileByPathFinderMock.run.mockResolvedValue(temporalFile);
    relativePathToAbsoluteConverterMock.run.mockReturnValue('/absolute/path/to/file');
    temporalFileByteByByteComparatorMock.run.mockRejectedValue(new Error('Comparison failed'));
    temporalFileUploaderMock.run.mockResolvedValue(undefined);
    temporalFileDeleterMock.run.mockResolvedValue(undefined);

    const result = await uploadOnRename.run(src, dest);

    expect(result.isRight()).toBe(true);
    expect(result.getRight()).toBe('success');
    calls(temporalFileByteByByteComparatorMock.run).toHaveLength(1);
    calls(temporalFileUploaderMock.run).toHaveLength(0);
    call(temporalFileDeleterMock.run).toBe(src);
  });
});
