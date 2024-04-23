import { Service } from 'diod';
import { Optional } from '../../../../../shared/types/Optional';
import { TemporalFilePath } from '../../domain/TemporalFilePath';
import { TemporalFileRepository } from '../../domain/TemporalFileRepository';

@Service()
export class TemporalFileChunkReader {
  constructor(private readonly repository: TemporalFileRepository) {}

  async run(
    path: string,
    length: number,
    position: number
  ): Promise<Optional<Buffer>> {
    const documentPath = new TemporalFilePath(path);

    const from = position;
    const to = position + length;

    const data = await this.repository.read(documentPath);

    const chunk = data.slice(from, to);

    if (chunk.byteLength === 0) {
      return Optional.empty();
    }

    return Optional.of(chunk);
  }
}
