import { describe } from 'vitest';
import { Environment } from '@internxt/inxt-js/build';
import { EnvironmentAndStorageThumbnailUploader } from '@/apps/main/thumbnails/infrastructure/EnvironmentAndStorageThumbnailUploader';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { deepMocked } from '../../../../../tests/vitest/utils.helper.test';
import { mockDeep } from 'vitest-mock-extended';
import { ActionState } from '@internxt/inxt-js/build/api';
import { logger } from '@/apps/shared/logger/logger';

vi.mock('@/infra/drive-server-wip/drive-server-wip.module');
vi.mock('@internxt/inxt-js/build');
vi.mock('@/apps/shared/logger/logger');

describe('EnvironmentAndStorageThumbnailUploader', () => {
  const createThumbnailMock = deepMocked(driveServerWipModule.files.createThumbnail);
  const mockBucket = 'test-bucket';
  const mockFileId = 123;
  const mockThumbnail = Buffer.from('mock-thumbnail');
  const environmentMocked = mockDeep<Environment>();
  const loggerMocked = deepMocked(logger.error);
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
      loggerMocked.mockReturnValue(new Error('upload error'));

      const result = await sut.uploadThumbnailToEnvironment(mockThumbnail);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toContain('upload error');
    });
  });

  describe('uploadThumbnailToStorage', () => {
    it('should not return an Error if thumbnail creation succeeds', async () => {
      createThumbnailMock.mockResolvedValue({ error: undefined });

      const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
      expect(result).not.toBeInstanceOf(Error);
    });

    it('returns Error if thumbnail creation fails', async () => {
      const error = new Error('thumbnail error');
      createThumbnailMock.mockResolvedValue({ error });
      loggerMocked.mockReturnValue(error);

      const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
      expect(result.error).toBe(error);
    });
  });

  describe('upload', () => {
    it('returns true when both environment and storage uploads succeed', async () => {
      createThumbnailMock.mockResolvedValue({ error: undefined });

      const result = await sut.upload(mockFileId, mockThumbnail);
      expect(result).toBe(true);
    });

    it('returns Error if environment upload fails', async () => {
      environmentMocked.upload.mockImplementation((_bucket, options) => {
        options.finishedCallback(new Error('env error'), '');
        return {} as ActionState;
      });
      loggerMocked.mockReturnValue(new Error('env error'));

      const result = await sut.upload(mockFileId, mockThumbnail);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toContain('env error');
    });

    it('returns Error if storage upload fails', async () => {
      createThumbnailMock.mockResolvedValue({ error: new Error('storage fail') });

      const result = await sut.upload(mockFileId, mockThumbnail);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toContain('storage fail');
    });
  });
});
