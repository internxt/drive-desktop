import { File } from '../../files/domain/File';
import { ContentsId } from '../domain/ContentsId';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import Logger from 'electron-log';

export class LocalContentsDeleter {
  constructor(private readonly local: LocalFileSystem) {}

  async run(file: File): Promise<void> {
    try {
      const contentsId = new ContentsId(file.contentsId);
      await this.local.remove(contentsId);
    } catch (err) {
      Logger.error(err);
    }
  }
}
