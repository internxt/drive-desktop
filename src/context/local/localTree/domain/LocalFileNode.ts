import { LocalFile } from '../../localFile/domain/LocalFile';
import { LocalFolderNode } from './LocalFolderNode';

export class LocalFileNode {
  private constructor(public readonly file: LocalFile) {}

  static from(file: LocalFile): LocalFileNode {
    return new LocalFileNode(file);
  }

  public get id(): string {
    return this.file.path;
  }

  public isFile(): this is LocalFileNode {
    return true;
  }

  public isFolder(): this is LocalFolderNode {
    return false;
  }
}
