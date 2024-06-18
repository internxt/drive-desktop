import { Folder } from '../../folders/domain/Folder';
import { FileNode } from './FileNode';
import { Node } from './Node';

export class FolderNode {
  private constructor(
    public readonly folder: Folder,
    private children: Map<string, Node>,
    public readonly isRoot: boolean
  ) {}

  static from(folder: Folder): FolderNode {
    return new FolderNode(folder, new Map(), false);
  }

  static createRoot(folder: Folder): FolderNode {
    return new FolderNode(folder, new Map(), true);
  }

  public get id(): string {
    return this.folder.path;
  }

  addChild(node: Node): void {
    if (this.children.has(node.id)) {
      throw new Error(`Duplicated node detected: ${node.id}`);
    }

    this.children.set(node.id, node);
  }

  public isFile(): this is FileNode {
    return false;
  }

  public isFolder(): this is FolderNode {
    return true;
  }
}
