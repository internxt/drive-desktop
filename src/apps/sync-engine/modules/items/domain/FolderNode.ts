import { Folder } from '../../folders/domain/Folder';
import { FileNode } from './FileNode';
import { Node } from './Node';
export class FolderNode {
  private constructor(
    public readonly folder: Folder,
    private childern: Map<string, Node>
  ) {}

  static from(folder: Folder): FolderNode {
    return new FolderNode(folder, new Map());
  }

  public get id(): string {
    return this.folder.path;
  }

  addChild(node: Node): void {
    if (this.childern.has(node.id)) {
      throw new Error('Child already exists');
    }

    this.childern.set(node.id, node);
  }

  public isFile(): this is FileNode {
    return false;
  }

  public isFolder(): this is FolderNode {
    return true;
  }
}
