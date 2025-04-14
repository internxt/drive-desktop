import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { FileNode } from './FileNode';
import { FolderNode } from './FolderNode';
import { Node } from './Node';

export class Tree {
  private tree = new Map<string, Node>();
  private trashedFiles = new Map<string, File>();
  private trashedFolders = new Map<string, Folder>();

  constructor(rootFolder: Folder) {
    const node = FolderNode.from(rootFolder);

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

  public get filePaths(): Array<string> {
    return this.files.map((f) => f.path);
  }

  public get trashedFilesList(): Array<File> {
    return Array.from(this.trashedFiles.values());
  }

  public appendTrashedFile(file: File) {
    this.trashedFiles.set(file.path, file);
  }

  public get trashedFoldersList(): Array<Folder> {
    return Array.from(this.trashedFolders.values());
  }

  public appendTrashedFolder(folder: Folder) {
    this.trashedFolders.set(folder.path, folder);
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

  public get folderPaths(): Array<string> {
    return this.folders.map((f) => f.path);
  }

  private addNode(node: Node): void {
    this.tree.set(node.path, node);
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
}
