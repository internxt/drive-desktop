import { AbsolutePath, createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BackupsContext } from '../BackupInfo';
import { fetchItems } from '../fetch-items/fetch-items';
import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { join } from 'node:path';
import { ExtendedDriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';

export type RemoteTree = {
  files: Record<RelativePath, ExtendedDriveFile>;
  folders: Record<RelativePath, ExtendedDriveFolder>;
};

type Items = {
  files: Array<SimpleDriveFile>;
  folders: Array<SimpleDriveFolder>;
};

export class Traverser {
  private createRootFolder({ rootPath, rootUuid }: { rootPath: AbsolutePath; rootUuid: FolderUuid }): ExtendedDriveFolder {
    return {
      uuid: rootUuid,
      parentUuid: undefined,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: createRelativePath('/'),
      absolutePath: rootPath,
      status: 'EXISTS',
      name: '',
    };
  }

  private traverse(context: BackupsContext, tree: RemoteTree, items: Items, currentFolder: ExtendedDriveFolder) {
    if (!items) return;
    if (context.abortController.signal.aborted) return;

    const filesInThisFolder = items.files.filter((file) => file.parentUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((file) => {
      const path = createRelativePath(currentFolder.path, file.nameWithExtension);
      const absolutePath = join(context.pathname, path) as AbsolutePath;
      const extendedFile = { ...file, path, absolutePath };

      tree.files[path] = extendedFile;
    });

    foldersInThisFolder.forEach((folder) => {
      const path = createRelativePath(currentFolder.path, folder.name);
      const absolutePath = join(context.pathname, path) as AbsolutePath;
      const extendedFolder = { ...folder, path, absolutePath };

      tree.folders[path] = extendedFolder;
      this.traverse(context, tree, items, extendedFolder);
    });
  }

  async run({ context }: { context: BackupsContext }): Promise<RemoteTree> {
    const items = await fetchItems({
      folderUuid: context.folderUuid,
      skipFiles: false,
      abortSignal: context.abortController.signal,
    });

    const rootFolder = this.createRootFolder({
      rootPath: context.pathname as AbsolutePath,
      rootUuid: context.folderUuid as FolderUuid,
    });

    const tree: RemoteTree = {
      files: {},
      folders: {
        [rootFolder.path]: rootFolder,
      },
    };

    this.traverse(context, tree, items, rootFolder);

    return tree;
  }
}
