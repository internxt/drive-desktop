import { File } from '../../files/domain/File';
import { LocalFileSystem } from '../domain/LocalFileSystem';

export class LocalContentChecker {
  constructor(private readonly local: LocalFileSystem) {}

  run(file: File): Promise<boolean> {
    return this.local.exists(file.contentsId);
  }
}
