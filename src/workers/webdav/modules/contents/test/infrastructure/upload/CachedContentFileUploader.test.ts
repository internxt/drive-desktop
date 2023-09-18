import { Readable } from 'stream';
import { CachedContentFileUploader } from '../../../infrastructure/upload/CachedContentFileUploader';
import { ContentFileUploaderMock } from '../../__mocks__/ContentFileUploaderMock';
import { ContentsCacheRepositoryMock } from '../../__mocks__/ContentsCacheRepositoryMock';
import { ContentsIdMother } from '../../domain/ContentsIdMother';

describe('cached content file uploader', () => {
  const contents = Readable.from('FILE CONTENTS');

  let uploader: ContentFileUploaderMock;
  let localContentsRepository: ContentsCacheRepositoryMock;

  let SUT: CachedContentFileUploader;

  beforeEach(() => {
    uploader = new ContentFileUploaderMock();
    localContentsRepository = new ContentsCacheRepositoryMock();

    SUT = new CachedContentFileUploader(uploader, localContentsRepository);
  });

  it('returns the id returned from the underlying uploader', async () => {
    const id = 'ac1c00d5-f3fb-5e81-9ad3-f8300060c2b0';

    uploader.uploadMock.mockResolvedValueOnce(id);
    localContentsRepository.writeMock.mockReturnValueOnce(Promise.resolve());

    const result = await SUT.upload(contents, 2001833926);

    expect(result).toEqual(id);
  });

  it('stores the file locally if there is enough space', async () => {
    const size = 544940296;
    const id = ContentsIdMother.random();

    uploader.uploadMock.mockResolvedValueOnce(id);
    localContentsRepository.writeMock.mockReturnValueOnce(Promise.resolve());

    await SUT.upload(contents, size);

    expect(localContentsRepository.writeMock).toHaveBeenCalledWith(
      id.value,
      contents,
      size
    );
  });
});
