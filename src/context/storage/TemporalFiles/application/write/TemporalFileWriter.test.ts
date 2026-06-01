import { mockDeep } from 'vitest-mock-extended';
import { TemporalFileWriter } from './TemporalFileWriter';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFileIOError } from '../../domain/errors/TemporalFileIOError';

describe('TemporalFileWriter', () => {
  const repository = mockDeep<TemporalFileRepository>();
  let temporalFileWriter: TemporalFileWriter;

  beforeEach(() => {
    temporalFileWriter = new TemporalFileWriter(repository);
  });

  it('should await repository writes', async () => {
    const writePromise = Promise.resolve();
    repository.write.mockReturnValue(writePromise);

    await expect(temporalFileWriter.run('/some/file.txt', Buffer.from('hello'), 5, 0)).resolves.toBeUndefined();
    expect(repository.write).toHaveBeenCalledTimes(1);
  });

  it('should throw TemporalFileIOError when repository write rejects', async () => {
    repository.write.mockRejectedValue(new Error('boom'));

    await expect(temporalFileWriter.run('/some/file.txt', Buffer.from('hello'), 5, 0)).rejects.toBeInstanceOf(
      TemporalFileIOError,
    );
  });
});
