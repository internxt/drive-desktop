import { File } from '../../files/domain/File';
import { ContentsId } from '../domain/ContentsId';
import { LocalFileSystem } from '../domain/LocalFileSystem';

export class LocalContentChecker {
  constructor(private readonly local: LocalFileSystem) {}

  run(file: File): Promise<boolean> {
    const contentsId = new ContentsId(file.contentsId);

    return this.local.exists(contentsId);
  }
}
