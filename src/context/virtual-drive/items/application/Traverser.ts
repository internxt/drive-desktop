import Logger from 'electron-log';
import {
  FolderStatus,
  FolderStatuses,
} from '../../folders/domain/FolderStatus';
import { Folder } from '../../folders/domain/Folder';
import { EitherTransformer } from '../../shared/application/EitherTransformer';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { createFolderFromServerFolder } from '../../folders/application/FolderCreatorFromServerFolder';
import { NameDecrypt } from '../domain/NameDecrypt';
import { Tree } from '../domain/Tree';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../shared/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../shared/domain/ServerFolder';

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};

export class Traverser {
  constructor(
    private readonly decrypt: NameDecrypt,
    private readonly baseFolderId: number,
    private readonly fileStatusesToFilter: Array<ServerFileStatus>,
    private readonly folderStatusesToFilter: Array<ServerFolderStatus>
  ) {}

  static existingItems(decrypt: NameDecrypt, baseFolderId: number): Traverser {
    return new Traverser(
      decrypt,
      baseFolderId,
      [ServerFileStatus.EXISTS],
      [ServerFolderStatus.EXISTS]
    );
  }

  static allItems(decrypt: NameDecrypt, baseFolderId: number): Traverser {
    return new Traverser(decrypt, baseFolderId, [], []);
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

    filesInThisFolder.forEach((file) => {
      if (!this.fileStatusesToFilter.includes(file.status)) {
        return;
      }

      const decryptedName = this.decrypt.decryptName(
        file.name,
        file.folderId.toString(),
        file.encrypt_version
      );
      const extensionToAdd = file.type ? `.${file.type}` : '';

      const relativeFilePath =
        `${currentFolder.path}/${decryptedName}${extensionToAdd}`.replaceAll(
          '//',
          '/'
        );

      EitherTransformer.handleWithEither(() =>
        createFileFromServerFile(file, relativeFilePath)
      ).fold(
        (error) => {
          Logger.warn(
            `[Traverser] File with path ${relativeFilePath} could not be created: `,
            error
          );
        },
        (file) => {
          tree.addFile(currentFolder, file);
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

      EitherTransformer.handleWithEither(() =>
        createFolderFromServerFolder(serverFolder, name)
      ).fold(
        (error) => {
          Logger.warn(
            `[Traverser] Folder with path ${name} could not be created: `,
            error
          );
        },
        (folder) => {
          tree.addFolder(currentFolder, folder);

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
