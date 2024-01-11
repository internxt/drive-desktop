import * as Sentry from '@sentry/electron/renderer';
import Logger from 'electron-log';
import { SyncEngineIpc } from '../../../../apps/sync-engine/ipcRendererSyncEngine';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../shared/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../shared/domain/ServerFolder';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { createFolderFromServerFolder } from '../../folders/application/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import {
  FolderStatus,
  FolderStatuses,
} from '../../folders/domain/FolderStatus';
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
    private readonly fileStatusesToFilter: Array<ServerFileStatus>,
    private readonly folderStatusesToFilter: Array<ServerFolderStatus>
  ) {}

  static existingItems(
    decrypt: NameDecrypt,
    ipc: SyncEngineIpc,
    baseFolderId: number
  ): Traverser {
    return new Traverser(
      decrypt,
      ipc,
      baseFolderId,
      [ServerFileStatus.EXISTS],
      [ServerFolderStatus.EXISTS]
    );
  }

  static allItems(
    decrypt: NameDecrypt,
    ipc: SyncEngineIpc,
    baseFolderId: number
  ): Traverser {
    return new Traverser(decrypt, ipc, baseFolderId, [], []);
  }

  private createRootFolder(): Folder {
    const rootFolderUuid = '43711926-15c2-5ebf-8c24-5099fa9af3c3';

    return Folder.from({
      id: this.baseFolderId,
      uuid: rootFolderUuid,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  private traverse(tree: Tree, items: Items, currentFolder: Folder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter(
      (file) => file.folderId === currentFolder.id
    );

    const foldersInThisFolder = items.folders.filter((folder) => {
      return folder.parentId === currentFolder.id;
    });

    filesInThisFolder.forEach((serverFile) => {
      if (!this.fileStatusesToFilter.includes(serverFile.status)) {
        return;
      }

      const decryptedName = this.decrypt.decryptName(
        serverFile.name,
        serverFile.folderId.toString(),
        serverFile.encrypt_version
      );
      const extensionToAdd = serverFile.type ? `.${serverFile.type}` : '';

      const relativeFilePath =
        `${currentFolder.path}/${decryptedName}${extensionToAdd}`.replaceAll(
          '//',
          '/'
        );

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
        }
      );
    });

    foldersInThisFolder.forEach((serverFolder: ServerFolder) => {
      const plainName =
        serverFolder.plain_name ||
        this.decrypt.decryptName(
          serverFolder.name,
          (serverFolder.parentId as number).toString(),
          '03-aes'
        ) ||
        serverFolder.name;

      const name = `${currentFolder.path}/${plainName}`;

      if (!this.folderStatusesToFilter.includes(serverFolder.status)) {
        return;
      }

      EitherTransformer.handleWithEither(() => {
        const folder = createFolderFromServerFolder(serverFolder, name);

        tree.addFolder(currentFolder, folder);

        return folder;
      }).fold(
        (error) => {
          Logger.warn(`[Traverser] Error adding folder:  ${error} `);
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
        }
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
