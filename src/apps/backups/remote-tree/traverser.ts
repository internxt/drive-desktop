import { ServerFile } from '@/context/shared/domain/ServerFile';
import { ServerFolder } from '@/context/shared/domain/ServerFolder';
import { createFileFromServerFile } from '@/context/virtual-drive/files/application/FileCreatorFromServerFile';
import { File } from '@/context/virtual-drive/files/domain/File';
import { createFolderFromServerFolder } from '@/context/virtual-drive/folders/application/create/FolderCreatorFromServerFolder';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStatus } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { getAllItemsByFolderUuid } from './get-all-items-by-folder-uuid';
import { logger } from '@/apps/shared/logger/logger';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};

export type RemoteTree = {
  files: Record<RelativePath, File>;
  folders: Record<RelativePath, Folder>;
};

export class Traverser {
  private createRootFolder({ id, uuid }: { id: number; uuid: string }): Folder {
    return Folder.from({
      id,
      uuid,
      parentId: null,
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  private traverse(tree: RemoteTree, items: Items, currentFolder: Folder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter((file) => file.folderUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((serverFile) => {
      const decryptedName = File.decryptName({
        plainName: serverFile.plainName,
        name: serverFile.name,
        parentId: serverFile.folderId,
        type: serverFile.type,
      });

      const relativePath = createRelativePath(currentFolder.path, decryptedName);

      try {
        const file = createFileFromServerFile(serverFile, relativePath);
        tree.files[relativePath] = file;
      } catch (exc) {
        logger.error({ msg: 'Error creating file from server file', exc });
      }
    });

    foldersInThisFolder.forEach((serverFolder) => {
      const decryptedName = Folder.decryptName({
        plainName: serverFolder.plain_name,
        name: serverFolder.name,
        parentId: serverFolder.parentId,
      });

      const relativePath = createRelativePath(currentFolder.path, decryptedName);

      try {
        const folder = createFolderFromServerFolder(serverFolder, relativePath);

        tree.folders[relativePath] = folder;

        this.traverse(tree, items, folder);
      } catch (exc) {
        logger.error({ msg: 'Error creating folder from server folder', exc });
      }
    });
  }

  async run({ rootFolderId, rootFolderUuid }: { rootFolderId: number; rootFolderUuid: string }) {
    const items = await getAllItemsByFolderUuid(rootFolderUuid);

    const rootFolder = this.createRootFolder({ id: rootFolderId, uuid: rootFolderUuid });

    const tree: RemoteTree = {
      files: {},
      folders: {},
    };

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
