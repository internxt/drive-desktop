import { OfflineFileFinder } from '../../files/application/OfflineFileFinder';
import { OfflineFileSizeIncreaser } from '../../files/application/OfflineFileSizeIncreaser';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';

export class OfflineContentsAppended {
  constructor(
    private readonly offlineFileFinder: OfflineFileFinder,
    private readonly offlineFileSizeIncreaser: OfflineFileSizeIncreaser,
    private readonly contentsRepository: OfflineContentsRepository
  ) {}

  async run(
    path: string,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const file = await this.offlineFileFinder.run({ path });

    await this.contentsRepository.writeToFile(
      file.id,
      buffer,
      length,
      position
    );

    await this.offlineFileSizeIncreaser.run(file.id, length);
  }
}
