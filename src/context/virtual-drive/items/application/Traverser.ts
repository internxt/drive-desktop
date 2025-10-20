import { getAllItems } from './RemoteItemsGenerator';
import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { join } from 'node:path';
import { ProcessSyncContext } from '@/apps/sync-engine/config';

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
  private static createRootFolder({ ctx }: { ctx: ProcessSyncContext }): ExtendedDriveFolder {
    return {
      uuid: ctx.rootUuid,
      parentUuid: undefined,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: createRelativePath('/'),
      absolutePath: ctx.rootPath as AbsolutePath,
      status: 'EXISTS',
      name: '',
    };
  }

  private static traverse(ctx: ProcessSyncContext, tree: Tree, items: Items, currentFolder: ExtendedDriveFolder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter((file) => file.parentUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((file) => {
      const path = createRelativePath(currentFolder.path, file.nameWithExtension);
      const absolutePath = join(ctx.rootPath, path) as AbsolutePath;
      const extendedFile = { ...file, path, absolutePath };

      if (file.status === 'DELETED' || file.status === 'TRASHED') {
        tree.trashedFiles.push(extendedFile);
      } else {
        tree.files.push(extendedFile);
      }
    });

    foldersInThisFolder.forEach((folder) => {
      const path = createRelativePath(currentFolder.path, folder.name);
      const absolutePath = join(ctx.rootPath, path) as AbsolutePath;
      const extendedFolder = { ...folder, path, absolutePath };

      if (folder.status === 'DELETED' || folder.status === 'TRASHED') {
        tree.trashedFolders.push(extendedFolder);
      } else {
        tree.folders.push(extendedFolder);
        this.traverse(ctx, tree, items, extendedFolder);
      }
    });
  }

  static async run({ ctx }: { ctx: ProcessSyncContext }) {
    const rootFolder = this.createRootFolder({ ctx });
    const items = await getAllItems({ ctx });

    const tree: Tree = {
      files: [],
      folders: [rootFolder],
      trashedFiles: [],
      trashedFolders: [],
    };

    this.traverse(ctx, tree, items, rootFolder);

    return tree;
  }
}
