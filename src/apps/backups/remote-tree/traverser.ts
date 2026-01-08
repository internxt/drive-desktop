import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

export type RemoteTree = {
  files: Map<AbsolutePath, ExtendedDriveFile>;
  folders: Map<AbsolutePath, ExtendedDriveFolder>;
};

type Items = {
  files: Array<SimpleDriveFile>;
  folders: Array<SimpleDriveFolder>;
};

export class Traverser {
  private static createRootFolder({ rootPath, rootUuid }: { rootPath: AbsolutePath; rootUuid: FolderUuid }): ExtendedDriveFolder {
    return {
      uuid: rootUuid,
      parentUuid: undefined,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      absolutePath: rootPath,
      status: 'EXISTS',
      name: '',
    };
  }

  private static traverse(tree: RemoteTree, items: Items, parent: ExtendedDriveFolder) {
    const filesInThisFolder = items.files.filter((file) => file.parentUuid === parent.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === parent.uuid);

    filesInThisFolder.forEach((file) => {
      const absolutePath = join(parent.absolutePath, file.name);
      const extendedFile = { ...file, absolutePath };

      tree.files.set(absolutePath, extendedFile);
    });

    foldersInThisFolder.forEach((folder) => {
      const absolutePath = join(parent.absolutePath, folder.name);
      const extendedFolder = { ...folder, absolutePath };

      tree.folders.set(absolutePath, extendedFolder);
      this.traverse(tree, items, extendedFolder);
    });
  }

  static async run({ userUuid, rootUuid, rootPath }: { userUuid: string; rootUuid: FolderUuid; rootPath: AbsolutePath }) {
    const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
      SqliteModule.FileModule.getByWorkspaceId({ userUuid, workspaceId: '' }),
      SqliteModule.FolderModule.getByWorkspaceId({ userUuid, workspaceId: '' }),
    ]);

    const items = {
      files: files.filter((file) => file.status === 'EXISTS'),
      folders: folders.filter((folder) => folder.status === 'EXISTS'),
    };

    const rootFolder = this.createRootFolder({ rootPath, rootUuid });

    const tree: RemoteTree = {
      files: new Map(),
      folders: new Map([[rootFolder.absolutePath, rootFolder]]),
    };

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
