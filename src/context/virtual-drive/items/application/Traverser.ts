import * as Sentry from '@sentry/electron/renderer';
import Logger from 'electron-log';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { createFolderFromServerFolder } from '../../folders/application/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatus, FolderStatuses } from '../../folders/domain/FolderStatus';
import { EitherTransformer } from '../../shared/application/EitherTransformer';
import { NameDecrypt } from '../domain/NameDecrypt';
import { Tree } from '../domain/Tree';
type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};

export class Traverser {
  constructor(
    private readonly decrypt: NameDecrypt,
    private readonly ipc: SyncEngineIpc,
    private readonly baseFolderId: number,
    private readonly baseFolderUuid: string,
    private fileStatusesToFilter: Array<ServerFileStatus>,
    private folderStatusesToFilter: Array<ServerFolderStatus>,
  ) {}

  static existingItems(decrypt: NameDecrypt, ipc: SyncEngineIpc, baseFolderId: number, baseFolderUuid: string): Traverser {
    return new Traverser(decrypt, ipc, baseFolderId, baseFolderUuid, [ServerFileStatus.EXISTS], [ServerFolderStatus.EXISTS]);
  }

  static allItems(decrypt: NameDecrypt, ipc: SyncEngineIpc, baseFolderId: number, baseFolderUuid: string): Traverser {
    return new Traverser(decrypt, ipc, baseFolderId, baseFolderUuid, [], []);
  }

  public setFileStatusesToFilter(statuses: Array<ServerFileStatus>): void {
    this.fileStatusesToFilter = statuses;
  }

  public setFolderStatusesToFilter(statuses: Array<ServerFolderStatus>): void {
    this.folderStatusesToFilter = statuses;
  }

  private createRootFolder(): Folder {
    return Folder.from({
      id: this.baseFolderId,
      uuid: this.baseFolderUuid,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  private traverse(tree: Tree, items: Items, currentFolder: Folder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter((file) => {
      return file.folderUid === currentFolder.uuid;
    });

    const foldersInThisFolder = items.folders.filter((folder) => {
      return folder.parentUid === currentFolder.uuid;
    });

    filesInThisFolder.forEach((serverFile) => {
      if (!this.fileStatusesToFilter.includes(serverFile.status)) {
        return;
      }

      const decryptedName = this.decrypt.decryptName(serverFile.name, serverFile.folderId.toString(), serverFile.encrypt_version);
      const extensionToAdd = serverFile.type ? `.${serverFile.type}` : '';

      const relativeFilePath = `${currentFolder.path}/${decryptedName}${extensionToAdd}`.replaceAll('//', '/');

      if (serverFile.status === ServerFileStatus.DELETED || serverFile.status === ServerFileStatus.TRASHED) {
        try {
          tree.appendTrashedFile(createFileFromServerFile(serverFile, relativeFilePath));
          return;
        } catch (error) {
          return;
        }
      }

      EitherTransformer.handleWithEither(() => {
        const file = createFileFromServerFile(serverFile, relativeFilePath);
        tree.addFile(currentFolder, file);
      }).fold(
        (error): void => {
          Logger.warn('[Traverser] Error adding file:', error);
          Sentry.captureException(error);
          this.ipc.send('SYNC_PROBLEM', {
            key: 'node-duplicated',
            additionalData: {
              name: serverFile.plainName,
            },
          });
        },
        () => {
          //  no-op
        },
      );
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

      if (serverFolder.status === ServerFolderStatus.DELETED || serverFolder.status === ServerFolderStatus.TRASHED) {
        try {
          tree.appendTrashedFolder(createFolderFromServerFolder(serverFolder, name));
          return;
        } catch (error) {
          Logger.warn(`[Traverser] Error adding folder to delete queue: ${error}`);
          return;
        }
      }

      EitherTransformer.handleWithEither(() => {
        const folder = createFolderFromServerFolder(serverFolder, name);

        tree.addFolder(currentFolder, folder);

        return folder;
      }).fold(
        (error) => {
          Logger.warn(`[Traverser] :  ${error} `);
          Sentry.captureException(error);
          this.ipc.send('SYNC_PROBLEM', {
            key: 'node-duplicated',
            additionalData: {
              name,
            },
          });
        },
        (folder) => {
          if (folder.hasStatus(FolderStatuses.EXISTS)) {
            // The folders and the files inside trashed or deleted folders
            // will have the status "EXISTS", to avoid filtering witch folders and files
            // are in a deleted or trashed folder they not included on the collection.
            // We cannot perform any action on them either way
            this.traverse(tree, items, folder);
          }
        },
      );
    });
  }

  public run(items: Items): Tree {
    const rootFolder = this.createRootFolder();

    const tree = new Tree(rootFolder);

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
