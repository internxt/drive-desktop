import { LocalFile } from '../../localFile/domain/LocalFile';
import { LocalFolder } from '../../localFolder/domain/LocalFolder';
import { LocalFileNode } from './LocalFileNode';
import { LocalFolderNode } from './LocalFolderNode';
import { Node } from './Node';
import { AbsolutePath } from '../../localFile/infrastructure/AbsolutePath';

export class LocalTree {
  private tree: Map<string, Node>;
  public readonly root: LocalFolder;

  constructor(path: AbsolutePath, modificationTime: number) {
    const localFolder = LocalFolder.from(path, modificationTime);
    const node = LocalFolderNode.from(localFolder);
    this.root = localFolder;

    this.tree = new Map<string, Node>();
    this.tree.set(path, node);
  }

  public get files(): Array<LocalFile> {
    const files: Array<LocalFile> = [];

    this.tree.forEach((node) => {
      if (node.isFile()) {
        files.push(node.file);
      }
    });

    return files;
  }
  public get folders(): Array<LocalFolder> {
    const folders: Array<LocalFolder> = [];

    this.tree.forEach((node) => {
      if (node.isFolder()) {
        folders.push(node.folder);
      }
    });

    return folders;
  }

  private addNode(node: Node): void {
    this.tree.set(node.id, node);
  }

  addFile(parentNode: LocalFolder, file: LocalFile) {
    const parent = this.tree.get(parentNode.path) as LocalFolderNode;

    if (!parent) {
      throw new Error(`Parent node not found for ${JSON.stringify(file.attributes(), null, 2)}`);
    }

    const node = LocalFileNode.from(file);

    parent.addChild(node);
    this.addNode(node);
  }

  addFolder(parentNode: LocalFolder, folder: LocalFolder) {
    const parent = this.tree.get(parentNode.path) as LocalFolderNode;

    if (!parent) {
      throw new Error('Parent node not found');
    }

    const node = LocalFolderNode.from(folder);

    parent.addChild(node);
    this.addNode(node);
  }

  has(id: string): boolean {
    return this.tree.has(id);
  }
}
