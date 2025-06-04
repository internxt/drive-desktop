import { describe } from 'vitest';
import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentAndStorageThumbnailUploader } from '@/apps/main/thumbnails/infrastructure/EnvironmentAndStorageThumbnailUploader';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { ActionState } from '@internxt/inxt-js/build/api';
import { loggerMock } from 'tests/vitest/mocks.helper.test';
vi.mock('@internxt/inxt-js/build');

describe('EnvironmentAndStorageThumbnailUploader', () => {
  const createThumbnailMock = deepMocked(driveServerWipModule.files.createThumbnail);
  const mockBucket = 'test-bucket';
  const mockFileId = 123;
  const mockThumbnail = Buffer.from('mock-thumbnail');
  const environmentMocked = mockDeep<Environment>();
  let sut: EnvironmentAndStorageThumbnailUploader;

  beforeEach(() => {
    vi.clearAllMocks();

    environmentMocked.upload.mockImplementation((_bucket, options) => {
      options.finishedCallback(null, 'env-id-default');
      return {} as ActionState;
    });

    sut = new EnvironmentAndStorageThumbnailUploader(environmentMocked, mockBucket);
  });

  describe('uploadThumbnailToEnvironment', () => {
    it('returns environment id on successful upload', async () => {
      const result = await sut.uploadThumbnailToEnvironment(mockThumbnail);
      expect(result.data).toBe('env-id-default');
    });

    it('returns Error if environment upload fails', async () => {
      environmentMocked.upload.mockImplementation((_bucket, options) => {
        options.finishedCallback(new Error('upload error'), '');
        return {} as ActionState;
      });
      loggerMock.error.mockReturnValue(new Error('Error uploading thumbnail to environment'));

      const result = await sut.uploadThumbnailToEnvironment(mockThumbnail);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toContain('Error uploading thumbnail to environment');
    });
  });

  describe('uploadThumbnailToStorage', () => {
    it('should not return an Error if thumbnail creation succeeds', async () => {
      createThumbnailMock.mockResolvedValue({ error: undefined });

      const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
      expect(result).not.toBeInstanceOf(Error);
    });

    it('returns Error if thumbnail creation fails', async () => {
      const error = new Error('Create thumbnail request was not successful');
      createThumbnailMock.mockResolvedValue({ error });
      loggerMock.error.mockReturnValue(error);

      const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
      expect(result.error).toBe(error);
      expect(result.error?.message).toContain('Create thumbnail request was not successful');
    });
  });

  describe('upload', () => {
    it('returns error as undefined when both environment and storage uploads succeed', async () => {
      createThumbnailMock.mockResolvedValue({ error: undefined });

      const { error } = await sut.upload(mockFileId, mockThumbnail);
      expect(error).toBe(undefined);
    });

    it('returns Error if environment upload fails', async () => {
      environmentMocked.upload.mockImplementation((_bucket, options) => {
        options.finishedCallback(new Error('env error'), '');
        return {} as ActionState;
      });
      loggerMock.error.mockReturnValue(new Error('Error uploading thumbnail to environment'));

      const { error } = await sut.upload(mockFileId, mockThumbnail);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Error uploading thumbnail to environment');
    });

    it('returns Error if storage upload fails', async () => {
      createThumbnailMock.mockResolvedValue({ error: new Error('Create thumbnail request was not successful') });

      const { error } = await sut.upload(mockFileId, mockThumbnail);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain('Create thumbnail request was not successful');
    });
  });
});
