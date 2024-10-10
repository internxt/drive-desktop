import { File } from '../../files/domain/File';
import { FolderNode } from './FolderNode';

export class FileNode {
  private constructor(public readonly file: File) {}

  static from(file: File): FileNode {
    return new FileNode(file);
  }

  public get id(): string {
    return this.file.path;
  }

  public isFile(): this is FileNode {
    return true;
  }

  public isFolder(): this is FolderNode {
    return false;
  }
}
