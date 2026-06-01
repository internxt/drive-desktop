import { Readable } from 'stream';
import { mockDeep } from 'vitest-mock-extended';
import { call, calls } from '../../../../../../tests/vitest/utils.helper';
import { TemporalFileUploader } from './TemporalFileUploader';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFileUploaderFactory } from '../../domain/upload/TemporalFileUploaderFactory';
import { EventBus } from '../../../../virtual-drive/shared/domain/EventBus';
import { TemporalFile } from '../../domain/TemporalFile';

describe('TemporalFileUploader', () => {
  const repository = mockDeep<TemporalFileRepository>();
  const uploaderFactory = mockDeep<TemporalFileUploaderFactory>();
  const eventBus = mockDeep<EventBus>();

  const temporalFile = TemporalFile.from({
    path: '/Documents/report.txt',
    size: 100,
    createdAt: new Date(),
    modifiedAt: new Date(),
  });

  const stopWatching = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();

    repository.watchFile.mockReturnValue(stopWatching);
    eventBus.publish.mockResolvedValue(undefined);

    uploaderFactory.read.mockReturnValue(uploaderFactory);
    uploaderFactory.document.mockReturnValue(uploaderFactory);
    uploaderFactory.replaces.mockReturnValue(uploaderFactory);
    uploaderFactory.abort.mockReturnValue(uploaderFactory);
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
});
