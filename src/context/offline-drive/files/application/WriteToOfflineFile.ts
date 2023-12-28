import { OfflineFileFileSystem } from '../domain/OfflineFileFileSystem';
import { OfflineFileRepository } from '../domain/OfflineFileRepository';

export class WriteToOfflineFile {
  constructor(
    private readonly repository: OfflineFileRepository,
    private readonly fileSystem: OfflineFileFileSystem
  ) {}

  async run(
    path: string,
    buffer: Buffer,
    length: number,
    position: number
  ): Promise<void> {
    const file = await this.repository.searchByPartial({ path });

    if (!file) {
      // TODO: IMPROVE THE
      throw new Error('File not found');
    }

    await this.fileSystem.writeToFile(file.id, buffer, length, position);

    file.increaseSizeBy(length);

    await this.repository.save(file);
  }
}
