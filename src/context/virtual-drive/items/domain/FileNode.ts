import { File } from '../../files/domain/File';
import { FolderNode } from './FolderNode';

export class FileNode {
  private constructor(public readonly file: File) {}

  static from(file: File) {
    return new FileNode(file);
  }

  public get path(): string {
    return this.file.path;
  }

  public isFile(): this is FileNode {
    return true;
  }

  public isFolder(): this is FolderNode {
    return false;
  }
}
