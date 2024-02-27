import { ContentsId } from '../domain/ContentsId';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import Logger from 'electron-log';

export class LocalContentsMover {
  constructor(private readonly fileSystem: LocalFileSystem) {}

  async run(contentsId: ContentsId, src: string): Promise<void> {
    const exists = await this.fileSystem.exists(contentsId);

    if (exists) {
      this.fileSystem.remove(contentsId);
    }

    await this.fileSystem.add(contentsId, src);

    Logger.info('Added', contentsId.value, 'to offline files contents cache');
  }
}
