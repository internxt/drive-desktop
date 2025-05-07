import * as Sentry from '@sentry/electron/renderer';
import { Service } from 'diod';
import Logger from 'electron-log';
import { ServerFolder } from '../../../shared/domain/ServerFolder';
import { createFolderFromServerFolder } from '../../folders/application/create/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { RemoteTree } from '../domain/RemoteTree';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { File } from '../../files/domain/File';
import { ServerFile } from '@/context/shared/domain/ServerFile';

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};

@Service()
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

      const relativeFilePath = `${currentFolder.path}/${decryptedName}`.replaceAll('//', '/');

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

      const name = `${currentFolder.path}/${decryptedName}`;

      try {
        const folder = createFolderFromServerFolder(serverFolder, name);

        tree.addFolder(currentFolder, folder);

        this.traverse(tree, items, folder);
      } catch (error) {
        Logger.warn('[Traverser] Error adding folder:', error);
        Sentry.captureException(error);
      }
    });
  }

  public run({ rootFolderId, rootFolderUuid, items }: { rootFolderId: number; rootFolderUuid: string; items: Items }): RemoteTree {
    const rootFolder = this.createRootFolder({ id: rootFolderId, uuid: rootFolderUuid });

    const tree = new RemoteTree(rootFolder);

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
