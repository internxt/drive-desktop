import path from 'path';
import { File } from '../../../../context/virtual-drive/files/domain/File';
import { Folder } from '../../../../context/virtual-drive/folders/domain/Folder';
import { FileNode } from './FileNode';
import { FolderNode } from './FolderNode';
import { Node } from './Node';
import Logger from 'electron-log';

export class RemoteTree {
  private tree = new Map<string, Node>();

  constructor(rootFolder: Folder) {
    const node = FolderNode.createRoot(rootFolder);
    Logger.debug('[REMOTE TREE] Creating root node', rootFolder);
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
      throw new Error('Root node is a file, which is not expected.');
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

  public addFile(parentNode: Folder, file: File): void {
    const parent = this.tree.get(parentNode.path) as FolderNode;

    if (!parent) {
      throw new Error(`Parent node not found for path: ${parentNode.path}`);
    }

    const node = FileNode.from(file);
    parent.addChild(node);
    this.addNode(node);
  }

  public addFolder(parentNode: Folder, folder: Folder): void {
    const parent = this.tree.get(parentNode.path) as FolderNode;

    if (!parent) {
      throw new Error(`Parent node not found for path: ${parentNode.path}`);
    }

    const node = FolderNode.from(folder);
    parent.addChild(node);
    this.addNode(node);
  }

  public has(id: string): boolean {
    return this.tree.has(id);
  }

  public get(id: string) {
    const node = this.tree.get(id);

    if (!node) {
      throw new Error(`Node not found with id: ${id}`);
    }

    if (node.isFile()) {
      return node.file;
    }

    return node.folder;
  }

  public hasParent(id: string): boolean {
    const dirname = path.dirname(id);
    const parentId = dirname === '.' ? path.sep : dirname;
    return this.has(parentId);
  }

  public getParent(id: string): Folder {
    const dirname = path.dirname(id);
    Logger.debug('[REMOTE TREE] Getting parent for', id, 'dirname', dirname);
    const parentId = dirname === '.' ? path.sep : dirname;

    Logger.debug('[REMOTE TREE] Getting parent for', id, 'parentId', parentId);
    const element = this.get(parentId);

    if (element.isFile()) {
      throw new Error(`Expected a folder but found a file at path: ${parentId}`);
    }

    return element;
  }
}
