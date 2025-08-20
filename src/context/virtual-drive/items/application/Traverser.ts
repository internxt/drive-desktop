import { getAllItems } from './RemoteItemsGenerator';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { join } from 'path';

type Items = {
  files: Array<SimpleDriveFile>;
  folders: Array<SimpleDriveFolder>;
};

export type Tree = {
  files: Array<ExtendedDriveFile>;
  folders: Array<ExtendedDriveFolder>;
  trashedFiles: Array<ExtendedDriveFile>;
  trashedFolders: Array<ExtendedDriveFolder>;
};

export class Traverser {
  constructor(
    private readonly rootPath: AbsolutePath,
    private readonly rootUuid: FolderUuid,
  ) {}

  private createRootFolder(): ExtendedDriveFolder {
    return {
      uuid: this.rootUuid,
      parentUuid: undefined,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: createRelativePath('/'),
      absolutePath: this.rootPath,
      status: 'EXISTS',
      name: '',
    };
  }

  private traverse(tree: Tree, items: Items, currentFolder: ExtendedDriveFolder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter((file) => file.parentUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((file) => {
      const path = createRelativePath(currentFolder.path, file.nameWithExtension);
      const absolutePath = join(this.rootPath, path) as AbsolutePath;
      const extendedFile = { ...file, path, absolutePath };

      if (file.status === 'DELETED' || file.status === 'TRASHED') {
        tree.trashedFiles.push(extendedFile);
      } else {
        tree.files.push(extendedFile);
      }
    });

    foldersInThisFolder.forEach((folder) => {
      const path = createRelativePath(currentFolder.path, folder.name);
      const absolutePath = join(this.rootPath, path) as AbsolutePath;
      const extendedFolder = { ...folder, path, absolutePath };

      if (folder.status === 'DELETED' || folder.status === 'TRASHED') {
        tree.trashedFolders.push(extendedFolder);
      } else {
        tree.folders.push(extendedFolder);
        this.traverse(tree, items, extendedFolder);
      }
    });
  }

  async run() {
    const rootFolder = this.createRootFolder();
    const items = await getAllItems();

    const tree: Tree = {
      files: [],
      folders: [rootFolder],
      trashedFiles: [],
      trashedFolders: [],
    };

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
