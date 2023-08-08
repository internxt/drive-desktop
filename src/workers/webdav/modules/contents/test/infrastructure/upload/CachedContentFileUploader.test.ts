import { Readable } from 'stream';
import { CachedContentFileUploader } from '../../../infrastructure/upload/CachedContentFileUploader';
import { ContentFileUploaderMock } from '../../__mocks__/ContentFileUploaderMock';
import { ContentsCacheRepositoryMock } from '../../__mocks__/ContentsCacheRepositoryMock';

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
    const id = '50af27f8-9e48-592c-8414-00d1cb64cb43';

    uploader.uploadMock.mockResolvedValueOnce(id);
    localContentsRepository.writeMock.mockReturnValueOnce(Promise.resolve());

    await SUT.upload(contents, size);

    expect(localContentsRepository.writeMock).toHaveBeenCalledWith(
      id,
      contents,
      size
    );
  });
});
