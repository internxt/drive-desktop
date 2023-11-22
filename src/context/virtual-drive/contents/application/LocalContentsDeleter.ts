import { File } from '../../files/domain/File';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import Logger from 'electron-log';

export class LocalContentsDeleter {
  constructor(private readonly local: LocalFileSystem) {}

  async run(file: File): Promise<void> {
    try {
      await this.local.remove(file.contentsId);
    } catch (err) {
      Logger.error(err);
    }
  }
}
