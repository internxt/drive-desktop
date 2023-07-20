import { Readable } from 'stream';
import { RetryableFileUploader } from '../../../infrastructure/storage/RetryableFileUploader';
import { ContentFileUploaderMock } from '../../__mocks__/ContentFileUploaderMock';

describe('Retryable File Uploader', () => {
  describe('retry attempts', () => {
    it('does not retry the upload if the upload succeeds the firts time', async () => {
      const resultFileId = 'f20cbe9b-a585-59de-ba86-b74078515bf1';
      const underlyingUpload = new ContentFileUploaderMock();
      const uploader = new RetryableFileUploader(underlyingUpload);
      underlyingUpload.uploadMock.mockResolvedValueOnce(resultFileId);
      await uploader.upload(2734663740, Readable.from(''));
      expect(underlyingUpload.uploadMock).toBeCalledTimes(1);
    });
    it('retries the upload if the upload fails', async () => {
      const resultFileId = 'f20cbe9b-a585-59de-ba86-b74078515bf1';
      const underlyingUpload = new ContentFileUploaderMock();
      const uploader = new RetryableFileUploader(underlyingUpload);
      underlyingUpload.uploadMock
        .mockRejectedValueOnce('Fake error')
        .mockResolvedValueOnce(resultFileId);
      await uploader.upload(4219131632, Readable.from(''));
      expect(underlyingUpload.uploadMock).toBeCalledTimes(2);
    });
    it('fails when all the retries have been attempted', async () => {
      const underlyingUpload = new ContentFileUploaderMock();
      const uploader = new RetryableFileUploader(underlyingUpload);
      underlyingUpload.uploadMock.mockRejectedValue('Fake error');
      await uploader.upload(1689528634, Readable.from('')).catch((error) => {
        expect(error).toBeDefined();
      });
      expect(underlyingUpload.uploadMock).toBeCalledTimes(
        RetryableFileUploader.MAX_RETRIES + 1
      );
    });
    it('does not fail if at least one attempt succeds', async () => {
      const resultFileId = 'f20cbe9b-a585-59de-ba86-b74078515bf1';

      const underlyingUpload = new ContentFileUploaderMock();
      const uploader = new RetryableFileUploader(underlyingUpload);

      underlyingUpload.uploadMock
        .mockRejectedValueOnce('Fake error')
        .mockRejectedValueOnce('Fake error')
        .mockRejectedValueOnce('Fake error')
        .mockResolvedValueOnce(resultFileId);

      const result = await uploader
        .upload(4219131632, Readable.from(''))
        .catch((error) => {
          expect(error).not.toBeDefined();
        });

      expect(result).toBe(resultFileId);
    });
  });
});
