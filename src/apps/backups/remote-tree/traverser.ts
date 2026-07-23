import { ExtendedDriveFile, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { ExtendedDriveFolder, FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import {
  DriveItemsByParentUuid,
  indexDriveItemsByParentUuid,
} from '@/backend/features/virtual-drive/tree-traversal/index-drive-items-by-parent-uuid';
import { traverseDepthFirst } from '@/backend/features/virtual-drive/tree-traversal/traverse-depth-first';
import { AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';
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

  private static async traverse(tree: RemoteTree, items: Items, parent: ExtendedDriveFolder) {
    const { filesByParentUuid, foldersByParentUuid } = indexDriveItemsByParentUuid(items);

    await traverseDepthFirst({
      root: parent,
      processNode: (currentFolder) => this.processFolder({ tree, currentFolder }),
      processChildren: (currentFolder) => this.processFolderChildren({ tree, currentFolder, filesByParentUuid, foldersByParentUuid }),
    });
  }

  private static processFolder({ tree, currentFolder }: { tree: RemoteTree; currentFolder: ExtendedDriveFolder }) {
    tree.folders.set(currentFolder.absolutePath, currentFolder);
    return true;
  }

  private static processFolderChildren({
    tree,
    currentFolder,
    filesByParentUuid,
    foldersByParentUuid,
  }: {
    tree: RemoteTree;
    currentFolder: ExtendedDriveFolder;
    filesByParentUuid: DriveItemsByParentUuid['filesByParentUuid'];
    foldersByParentUuid: DriveItemsByParentUuid['foldersByParentUuid'];
  }) {
    const filesInThisFolder = filesByParentUuid.get(currentFolder.uuid);
    const foldersInThisFolder = foldersByParentUuid.get(currentFolder.uuid);

    if (filesInThisFolder && filesInThisFolder.length > 0) {
      filesInThisFolder.forEach((file) => {
        const absolutePath = join(currentFolder.absolutePath, file.name);
        const extendedFile = { ...file, absolutePath };

        tree.files.set(absolutePath, extendedFile);
      });
    }
    if (!foldersInThisFolder || foldersInThisFolder.length === 0) return [];

    return foldersInThisFolder.map((folder) => {
      const absolutePath = join(currentFolder.absolutePath, folder.name);
      return { ...folder, absolutePath };
    });
  }

  static async run({ userUuid, rootUuid, rootPath }: { userUuid: string; rootUuid: FolderUuid; rootPath: AbsolutePath }) {
    const [{ data: files = [] }, { data: folders = [] }] = await Promise.all([
      SqliteModule.FileModule.getByWorkspaceId({ userUuid, workspaceId: '', fileStatus: 'EXISTS' }),
      SqliteModule.FolderModule.getByWorkspaceId({ userUuid, workspaceId: '', folderStatus: 'EXISTS' }),
    ]);

    const rootFolder = this.createRootFolder({ rootPath, rootUuid });

    const tree: RemoteTree = {
      files: new Map(),
      folders: new Map(),
    };

    await this.traverse(tree, { files, folders }, rootFolder);

    return tree;
  }
}
