import { OfflineFileFinder } from '../../files/application/OfflineFileFinder';
import { OfflineFileSizeIncreaser } from '../../files/application/OfflineFileSizeIncreaser';
import { OfflineContentsRepository } from '../domain/OfflineContentsRepository';
import { OfflineContentsIOError } from '../domain/errors/IOError';

export class OfflineContentsAppender {
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

    try {
      await this.contentsRepository.writeToFile(
        file.id,
        buffer,
        length,
        position
      );
    } catch (error: unknown) {
      throw new OfflineContentsIOError();
    }

    await this.offlineFileSizeIncreaser.run(file.id, buffer.length);
  }
}
