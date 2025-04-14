import { Folder } from '../../folders/domain/Folder';
import Logger from 'electron-log';
import { FileNode } from './FileNode';
import { Node } from './Node';
export class FolderNode {
  private constructor(
    public readonly folder: Folder,
    private children: Map<string, Node>,
  ) {}

  static from(folder: Folder): FolderNode {
    return new FolderNode(folder, new Map());
  }

  public get path(): string {
    return this.folder.path;
  }

  addChild(node: Node): void {
    if (this.children.has(node.path)) {
      Logger.warn(`[New Error] Duplicated node detected: ${node.path}`);
      return;
    }

    this.children.set(node.path, node);
  }

  public isFile(): this is FileNode {
    return false;
  }

  public isFolder(): this is FolderNode {
    return true;
  }
}
