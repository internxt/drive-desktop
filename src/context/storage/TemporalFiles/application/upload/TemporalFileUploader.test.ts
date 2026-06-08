import { Readable } from 'node:stream';
import { mockDeep } from 'vitest-mock-extended';
import { partialSpyOn } from '../../../../../../tests/vitest/utils.helper';
import configStore from '../../../../../apps/main/config';
import {
  clearMaxFileSizeRejectionModal,
  clearUploadSizeLimitBlockedPath,
  isUploadSizeLimitBlockedPath,
} from '../../../../../backend/features/user/file-size-limit/add-max-file-size-rejection';
import { EventBus } from '../../../../virtual-drive/shared/domain/EventBus';
import { TemporalFile } from '../../domain/TemporalFile';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFileUploaderFactory } from '../../domain/upload/TemporalFileUploaderFactory';
import { TemporalFileUploader } from './TemporalFileUploader';
import { call, calls } from '../../../../../../tests/vitest/utils.helper';

describe('TemporalFileUploader', () => {
  const configGetMock = partialSpyOn(configStore, 'get');
  const repository = mockDeep<TemporalFileRepository>();
  const uploaderFactory = mockDeep<TemporalFileUploaderFactory>();
  const eventBus = mockDeep<EventBus>();

  const temporalFile = TemporalFile.from({
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    modifiedAt: new Date('2026-01-01T00:00:00.000Z'),
    path: '/file.txt',
    size: 101,
  });

  const stopWatching = vi.fn();
  beforeEach(() => {
    repository.watchFile.mockReturnValue(stopWatching);
    eventBus.publish.mockResolvedValue(undefined);
    uploaderFactory.read.mockReturnValue(uploaderFactory);
    uploaderFactory.document.mockReturnValue(uploaderFactory);
    uploaderFactory.replaces.mockReturnValue(uploaderFactory);
    uploaderFactory.abort.mockReturnValue(uploaderFactory);
    uploaderFactory.build.mockReturnValue(async () => 'contents-id');
    repository.stream.mockResolvedValue(Readable.from(['content']));
  });

  afterEach(() => {
    clearMaxFileSizeRejectionModal();
    clearUploadSizeLimitBlockedPath('/file.txt');
  });

  it('retries content upload on RATE_LIMITED and succeeds', async () => {
    // Given
    repository.stream.mockResolvedValue(new Readable({ read() {} }));

    uploaderFactory.build
      .mockReturnValueOnce(() => Promise.reject({ status: 429, message: JSON.stringify({ retry_after: 0.001 }) }))
      .mockReturnValueOnce(() => Promise.resolve('contents-id'));

    const sut = new TemporalFileUploader(repository, uploaderFactory, eventBus);

    // When
    const result = await sut.run(temporalFile);

    // Then
    expect(result).toBe('contents-id');
    calls(repository.stream).toHaveLength(2);
    calls(uploaderFactory.build).toHaveLength(2);
    calls(eventBus.publish).toHaveLength(1);
    calls(stopWatching).toHaveLength(1);
  });

  it('stops retrying on non-retryable upload errors', async () => {
    // Given
    repository.stream.mockResolvedValue(new Readable({ read() {} }));
    uploaderFactory.build.mockReturnValue(() => Promise.reject(new Error('broken stream')));

    const sut = new TemporalFileUploader(repository, uploaderFactory, eventBus);

    // When/Then
    await expect(sut.run(temporalFile)).rejects.toThrow();

    calls(repository.stream).toHaveLength(1);
    calls(uploaderFactory.build).toHaveLength(1);
    calls(eventBus.publish).toHaveLength(0);
    call(stopWatching).toStrictEqual([]);
  });

  it('should reject oversized temporal files before opening the upload stream', async () => {
    configGetMock.mockReturnValue(100);

    const uploader = new TemporalFileUploader(repository, uploaderFactory, eventBus);

    await expect(uploader.run(temporalFile)).rejects.toThrow('UPLOAD_SIZE_LIMIT_EXCEEDED');
    expect(isUploadSizeLimitBlockedPath('/file.txt')).toBe(true);
    expect(uploaderFactory.build).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('should continue upload when the stored limit is unavailable', async () => {
    configGetMock.mockReturnValue(0);

    const uploader = new TemporalFileUploader(repository, uploaderFactory, eventBus);

    await expect(uploader.run(temporalFile)).resolves.toBe('contents-id');
    expect(repository.stream).toHaveBeenCalledWith(temporalFile.path);
    expect(uploaderFactory.build).toHaveBeenCalled();
  });

  it('should upload temporal files when they fit the stored limit', async () => {
    configGetMock.mockReturnValue(101);

    const uploader = new TemporalFileUploader(repository, uploaderFactory, eventBus);

    await expect(uploader.run(temporalFile)).resolves.toBe('contents-id');
    expect(repository.stream).toHaveBeenCalledWith(temporalFile.path);
    expect(uploaderFactory.build).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });
});
