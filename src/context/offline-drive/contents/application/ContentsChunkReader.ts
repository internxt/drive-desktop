import { Optional } from '../../../../shared/types/Optional';
import { ContentsRepository } from '../domain/ContentsRepository';

export class ContentsChunkReader {
  constructor(private readonly repository: ContentsRepository) {}

  async run(
    contentsPath: string,
    length: number,
    position: number
  ): Promise<Optional<Buffer>> {
    const data = await this.repository.read(contentsPath);

    if (position >= data.length) {
      return Optional.empty();
    }

    const chunk = data.slice(position, position + length);

    return Optional.of(chunk);
  }
}
