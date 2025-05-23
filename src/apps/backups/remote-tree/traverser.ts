import { ServerFile } from '@/context/shared/domain/ServerFile';
import { ServerFolder } from '@/context/shared/domain/ServerFolder';
import { createFileFromServerFile } from '@/context/virtual-drive/files/application/FileCreatorFromServerFile';
import { File } from '@/context/virtual-drive/files/domain/File';
import { createFolderFromServerFolder } from '@/context/virtual-drive/folders/application/create/FolderCreatorFromServerFolder';
import { Folder } from '@/context/virtual-drive/folders/domain/Folder';
import { FolderStatus } from '@/context/virtual-drive/folders/domain/FolderStatus';
import { RemoteTree } from '@/apps/backups/remote-tree/domain/RemoteTree';
import * as Sentry from '@sentry/electron/renderer';
import Logger from 'electron-log';
import { getAllItemsByFolderUuid } from './get-all-items-by-folder-uuid';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { BackupsContext } from '../BackupInfo';

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
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

  private traverse(context: BackupsContext, tree: RemoteTree, items: Items, currentFolder: Folder) {
    if (!items) return;
    if (context.abortController.signal.aborted) return;

    const filesInThisFolder = items.files.filter((file) => file.folderUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((serverFile) => {
      const decryptedName = File.decryptName({
        plainName: serverFile.plainName,
        name: serverFile.name,
        parentId: serverFile.folderId,
        type: serverFile.type,
      });

      const relativeFilePath = createRelativePath(currentFolder.path, decryptedName);

      try {
        const file = createFileFromServerFile(serverFile, relativeFilePath);
        tree.addFile(currentFolder, file);
      } catch (error) {
        Logger.warn('[Traverser] Error adding file:', error);
        Sentry.captureException(error);
      }
    });

    foldersInThisFolder.forEach((serverFolder) => {
      const decryptedName = Folder.decryptName({
        plainName: serverFolder.plain_name,
        name: serverFolder.name,
        parentId: serverFolder.parentId,
      });

      const name = createRelativePath(currentFolder.path, decryptedName);

      try {
        const folder = createFolderFromServerFolder(serverFolder, name);

        tree.addFolder(currentFolder, folder);

        this.traverse(context, tree, items, folder);
      } catch (error) {
        Logger.warn('[Traverser] Error adding folder:', error);
        Sentry.captureException(error);
      }
    });
  }

  async run({ context }: { context: BackupsContext }): Promise<RemoteTree> {
    const items = await getAllItemsByFolderUuid(context.folderUuid);

    const rootFolder = this.createRootFolder({ id: context.folderId, uuid: context.folderUuid });

    const tree = new RemoteTree(rootFolder);

    this.traverse(context, tree, items, rootFolder);

    return tree;
  }
}
