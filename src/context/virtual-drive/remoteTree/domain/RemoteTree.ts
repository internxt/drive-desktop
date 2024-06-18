import path from 'path';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { FileNode } from './FileNode';
import { FolderNode } from './FolderNode';
import { Node } from './Node';

export class RemoteTree {
  private tree = new Map<string, Node>();

  constructor(rootFolder: Folder) {
    const node = FolderNode.createRoot(rootFolder);

    this.tree.set('/', node);
  }

  public get files(): Array<File> {
    const files: Array<File> = [];

    this.tree.forEach((node) => {
      if (node.isFile()) {
        files.push(node.file);
      }
    });

    return files;
  }

  public get root(): Folder {
    const r = this.get('/');

    if (r.isFile()) {
      throw new Error('Found a file as root');
    }

    return r;
  }

  public get filePaths(): Array<string> {
    return this.files.map((f) => f.path);
  }

  public get folders(): Array<Folder> {
    const folders: Array<Folder> = [];

    this.tree.forEach((node) => {
      if (node.isFolder()) {
        folders.push(node.folder);
      }
    });

    return folders;
  }

  public get foldersWithOutRoot(): Array<Folder> {
    const folders: Array<Folder> = [];

    this.tree.forEach((node) => {
      if (node.isFolder() && !node.isRoot) {
        folders.push(node.folder);
      }
    });

    return folders;
  }

  public get folderPaths(): Array<string> {
    return this.folders.map((f) => f.path);
  }

  private addNode(node: Node): void {
    this.tree.set(node.id, node);
  }

  addFile(parentNode: Folder, file: File) {
    const parent = this.tree.get(parentNode.path) as FolderNode;

    if (!parent) {
      throw new Error('Parent node not found');
    }

    const node = FileNode.from(file);

    parent.addChild(node);
    this.addNode(node);
  }

  addFolder(parentNode: Folder, folder: Folder) {
    const parent = this.tree.get(parentNode.path) as FolderNode;

    if (!parent) {
      throw new Error('Parent node not found');
    }

    const node = FolderNode.from(folder);

    parent.addChild(node);
    this.addNode(node);
  }

  has(id: string): boolean {
    return this.tree.has(id);
  }

  get(id: string): File | Folder {
    const node = this.tree.get(id);

    if (!node) {
      throw new Error(`Could not get the node ${id}`);
    }

    if (node.isFile()) {
      return node.file;
    }

    return node.folder;
  }

  hasParent(id: string): boolean {
    const dirname = path.posix.dirname(id);
    const parentId = dirname === '.' ? path.posix.sep : dirname;

    return this.has(parentId);
  }

  getParent(id: string): Folder {
    const dirname = path.posix.dirname(id);
    const parentId = dirname === '.' ? path.posix.sep : dirname;

    const element = this.get(parentId);

    if (element.isFile()) {
      throw new Error('A file found as a parent node');
    }

    return element;
  }
}
