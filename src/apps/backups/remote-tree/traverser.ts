import { AbsolutePath, createRelativePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BackupsContext } from '../BackupInfo';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export type RemoteTree = {
  files: Record<AbsolutePath, ExtendedDriveFile>;
  folders: Record<AbsolutePath, ExtendedDriveFolder>;
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
      const absolutePath = join(currentFolder.absolutePath, file.nameWithExtension);
      const extendedFile = { ...file, path, absolutePath };

      tree.files[absolutePath] = extendedFile;
    });

    foldersInThisFolder.forEach((folder) => {
      const path = createRelativePath(currentFolder.path, folder.name);
      const absolutePath = join(currentFolder.absolutePath, folder.name);
      const extendedFolder = { ...folder, path, absolutePath };

      tree.folders[absolutePath] = extendedFolder;
      this.traverse(context, tree, items, extendedFolder);
    });
  }

  async run({ context }: { context: BackupsContext }): Promise<RemoteTree> {
    const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
      SqliteModule.FileModule.getByWorkspaceId({ userUuid: context.userUuid, workspaceId: '' }),
      SqliteModule.FolderModule.getByWorkspaceId({ userUuid: context.userUuid, workspaceId: '' }),
    ]);

    const items = {
      files: files.filter((file) => file.status === 'EXISTS'),
      folders: folders.filter((folder) => folder.status === 'EXISTS'),
    };

    const rootFolder = this.createRootFolder({
      rootPath: context.pathname,
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
