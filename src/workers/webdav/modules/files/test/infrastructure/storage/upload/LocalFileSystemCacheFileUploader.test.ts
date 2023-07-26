import { CachedContentFileUploader } from '../../../../infrastructure/storage/upload/CachedContentFileUploader';
import { ContentFileUploaderMock } from '../../../__mocks__/ContentFileUploaderMock';
import { ContentsCacheRepositoryMock } from '../../../__mocks__/ContentsCacheRepositoryMock';
import { Readable } from 'stream';

describe('cached content file uploader', () => {
  const cacheSize = 100;
  const contents = Readable.from('FILE CONTENTS');

  let uploader: ContentFileUploaderMock;
  let localContentsRepository: ContentsCacheRepositoryMock;

  let SUT: CachedContentFileUploader;

  beforeEach(() => {
    uploader = new ContentFileUploaderMock();
    localContentsRepository = new ContentsCacheRepositoryMock();

    SUT = new CachedContentFileUploader(
      uploader,
      localContentsRepository,
      cacheSize
    );
  });

  it.each([10, cacheSize + 1])(
    'returns the id returned from the underlying uploader',
    async (size) => {
      const id = 'ac1c00d5-f3fb-5e81-9ad3-f8300060c2b0';

      uploader.uploadMock.mockResolvedValueOnce(id);
      localContentsRepository.writeMock.mockReturnValueOnce(Promise.resolve());

      const result = await SUT.upload(contents, size);

      expect(result).toEqual(id);
    }
  );

  it('stores the file locally if there is enough space', async () => {
    const size = 10;
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

  it('does not store the file locally if file size exceeds the cahce sapce', async () => {
    const size = cacheSize + 1;
    const id = '80f0d646-6881-5568-8fff-f14d11371e24';

    uploader.uploadMock.mockResolvedValueOnce(id);

    await SUT.upload(contents, size);

    expect(localContentsRepository.writeMock).not.toHaveBeenCalled();
  });
});
