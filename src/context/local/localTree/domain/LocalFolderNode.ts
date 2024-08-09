import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { LocalFileNode } from './LocalFileNode';
import { Node } from './Node';

export class LocalFolderNode {
  private constructor(
    public readonly folder: LocalFolder,
    private children: Map<string, Node>
  ) {}

  static from(folder: LocalFolder): LocalFolderNode {
    return new LocalFolderNode(folder, new Map());
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

  public isFile(): this is LocalFileNode {
    return false;
  }

  public isFolder(): this is LocalFolderNode {
    return true;
  }
}
