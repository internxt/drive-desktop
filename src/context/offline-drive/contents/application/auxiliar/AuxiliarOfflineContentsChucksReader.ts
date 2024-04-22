import { Service } from 'diod';
import { Optional } from '../../../../../shared/types/Optional';
import { OfflineFileId } from '../../../files/domain/OfflineFileId';
import { OfflineContentsRepository } from '../../domain/OfflineContentsRepository';
import Logger from 'electron-log';

@Service()
export class AuxiliarOfflineContentsChucksReader {
  constructor(private readonly repository: OfflineContentsRepository) {}

  async run(
    id: OfflineFileId,
    length: number,
    position: number
  ): Promise<Optional<Buffer>> {
    const data = await this.repository.readFromId(id);

    if (position >= data.length) {
      return Optional.empty();
    }

    const chunk = data.slice(position, position + length);

    Logger.debug('Read from auxiliar file', id);

    return Optional.of(chunk);
  }
}
