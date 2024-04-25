import { Service } from 'diod';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFileIOError } from '../../domain/errors/TemporalFileIOError';

@Service()
export class TemporalFileWriter {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(
    path: string,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const documentPath = new TemporalFilePath(path);

    try {
      this.repository.write(documentPath, buffer, length, position);
    } catch (error: unknown) {
      throw new TemporalFileIOError();
    }
  }
}
