import { mockDeep } from 'vitest-mock-extended';
import { ContentsUploader } from './ContentsUploader';
import { EnvironmentRemoteFileContentsManagersFactory } from '../infrastructure/EnvironmentRemoteFileContentsManagersFactory';
import { RelativePathToAbsoluteConverter } from '../../shared/application/RelativePathToAbsoluteConverter';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { EnvironmentFileUploaderError } from '@/infra/inxt-js/file-uploader/process-error';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('contents-uploader', () => {
  const remoteContentsManagersFactory = mockDeep<EnvironmentRemoteFileContentsManagersFactory>();
  const relativePathToAbsoluteConverter = mockDeep<RelativePathToAbsoluteConverter>();
  const uploader = mockDeep<EnvironmentFileUploader>();
  const service = new ContentsUploader(remoteContentsManagersFactory, relativePathToAbsoluteConverter);

  beforeEach(() => {
    vi.clearAllMocks();

    relativePathToAbsoluteConverter.run.mockReturnValue('abolutePath');
    remoteContentsManagersFactory.uploader.mockReturnValue(uploader);
  });

  it('should throw error if upload fails', async () => {
    // Given
    uploader.upload.mockResolvedValue({ error: new EnvironmentFileUploaderError('UNKNOWN') });
    // When
    const promise = service.run('');
    // Then
    await expect(promise).rejects.toThrow();
    expect(loggerMock.error).toBeCalledTimes(1);
  });

  it('should return contents id if upload is successful', async () => {
    // Given
    uploader.upload.mockResolvedValue({ data: 'contentsId' as ContentsId });
    // When
    const result = await service.run('');
    // Then
    expect(result).toEqual({ id: 'contentsId', size: 1024 });
  });
});
