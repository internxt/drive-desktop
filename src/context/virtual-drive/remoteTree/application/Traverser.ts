import * as Sentry from '@sentry/electron/renderer';
import { Service } from 'diod';
import Logger from 'electron-log';
import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { createFolderFromServerFolder } from '../../folders/application/create/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatus, FolderStatuses } from '../../folders/domain/FolderStatus';
import { RemoteTree } from '../domain/RemoteTree';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { CryptoJsNameDecrypt } from '../../items/infrastructure/CryptoJsNameDecrypt';

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};
@Service()
export class Traverser {
  constructor(
    private readonly decrypt: CryptoJsNameDecrypt,
    private readonly fileStatusesToFilter: Array<ServerFileStatus>,
    private readonly folderStatusesToFilter: Array<ServerFolderStatus>,
  ) {}

  static existingItems(decrypt: CryptoJsNameDecrypt): Traverser {
    return new Traverser(decrypt, [ServerFileStatus.EXISTS], [ServerFolderStatus.EXISTS]);
  }

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
      if (!this.fileStatusesToFilter.includes(serverFile.status)) {
        return;
      }

      const decryptedName =
        serverFile.plainName ?? this.decrypt.decryptName(serverFile.name, serverFile.folderId.toString(), serverFile.encrypt_version);
      const extensionToAdd = serverFile.type ? `.${serverFile.type}` : '';

      const relativeFilePath = `${currentFolder.path}/${decryptedName}${extensionToAdd}`.replaceAll('//', '/');

      try {
        const file = createFileFromServerFile(serverFile, relativeFilePath);
        tree.addFile(currentFolder, file);
      } catch (error) {
        Logger.warn('[Traverser] Error adding file:', error);
        Sentry.captureException(error);
      }
    });

    foldersInThisFolder.forEach((serverFolder: ServerFolder) => {
      const plainName =
        serverFolder.plain_name ||
        this.decrypt.decryptName(serverFolder.name, (serverFolder.parentId as number).toString(), '03-aes') ||
        serverFolder.name;

      const name = `${currentFolder.path}/${plainName}`;

      if (!this.folderStatusesToFilter.includes(serverFolder.status)) {
        return;
      }

      try {
        const folder = createFolderFromServerFolder(serverFolder, name);

        tree.addFolder(currentFolder, folder);

        if (folder.hasStatus(FolderStatuses.EXISTS)) {
          // The folders and the files inside trashed or deleted folders
          // will have the status "EXISTS", to avoid filtering witch folders and files
          // are in a deleted or trashed folder they not included on the collection.
          // We cannot perform any action on them either way
          this.traverse(tree, items, folder);
        }
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
