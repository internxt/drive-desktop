import {describe} from 'vitest';
import {Environment} from '@internxt/inxt-js/build';
import {
    EnvironmentAndStorageThumbnailUploader
} from '@/apps/main/thumbnails/infrastructure/EnvironmentAndStorageThumbnailUploader';

import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';


vi.mock('@/infra/drive-server-wip/drive-server-wip.module', () => ({
    driveServerWipModule: {
        files: {
            createThumbnail: vi.fn(),
        }
    }
}));

describe('EnvironmentAndStorageThumbnailUploader', () => {
    const mockBucket = 'test-bucket';
    const mockFileId = 123;
    const mockThumbnail = Buffer.from('mock-thumbnail');

    let mockEnvironment: Environment;
    let sut: EnvironmentAndStorageThumbnailUploader;

    const setupSutWithUpload = (uploadImpl: (bucket: string, options: any) => any) => {
        mockEnvironment = {
            upload: vi.fn(uploadImpl),
        } as unknown as Environment;
        return new EnvironmentAndStorageThumbnailUploader(mockEnvironment, mockBucket);
    };

    beforeEach(() => {
        mockEnvironment = {
            upload: vi.fn((_bucket, options) => {
                options.finishedCallback(null, 'env-id-default');
                return true;
            }),
        } as unknown as Environment;

        sut = new EnvironmentAndStorageThumbnailUploader(mockEnvironment, mockBucket);
        vi.clearAllMocks();
    });

    describe('uploadThumbnailToEnvironment', () => {
        it('returns environment id on successful upload', async () => {
            const result = await sut.uploadThumbnailToEnvironment(mockThumbnail);
            expect(result).toBe('env-id-default');
        });

        it('returns Error if environment upload fails', async () => {
            sut = setupSutWithUpload((_bucket, options) => {
                options.finishedCallback(new Error('upload error'), '');
                return true;
            });

            const result = await sut.uploadThumbnailToEnvironment(mockThumbnail);
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toContain('upload error');
        });
    });

    describe('uploadThumbnailToStorage', () => {
        it('returns true if thumbnail creation succeeds', async () => {
            (driveServerWipModule.files.createThumbnail as any).mockResolvedValue({ error: null });

            const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
            expect(result).toBe(true);
        });

        it('returns Error if thumbnail creation fails', async () => {
            const error = new Error('thumbnail error');
            (driveServerWipModule.files.createThumbnail as any).mockResolvedValue({ error });

            const result = await sut.uploadThumbnailToStorage('env-id', mockFileId, mockThumbnail);
            expect(result).toBe(error);
        });
    });

    describe('upload', () => {
        it('returns true when both environment and storage uploads succeed', async () => {
            (driveServerWipModule.files.createThumbnail as any).mockResolvedValue({ error: null });

            const result = await sut.upload(mockFileId, mockThumbnail);
            expect(result).toBe(true);
        });

        it('returns Error if environment upload fails', async () => {
            sut = setupSutWithUpload((_bucket, options) => {
                options.finishedCallback(new Error('env error'), '');
                return true;
            });

            const result = await sut.upload(mockFileId, mockThumbnail);
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toContain('env error');
        });

        it('returns Error if storage upload fails', async () => {
            (driveServerWipModule.files.createThumbnail as any).mockResolvedValue({ error: new Error('storage fail') });

            const result = await sut.upload(mockFileId, mockThumbnail);
            expect(result).toBeInstanceOf(Error);
            expect((result as Error).message).toContain('storage fail');
        });
    });
});