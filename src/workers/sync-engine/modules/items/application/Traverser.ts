import Logger from 'electron-log';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../../filesystems/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../filesystems/domain/ServerFolder';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { Folder } from '../../folders/domain/Folder';
import { ItemsIndexedByPath } from '../domain/ItemsIndexedByPath';
import { EitherTransformer } from '../../shared/application/EitherTransformer';
import { createFileFromServerFile } from './FileCreatorFromServerFile';
import { createFolderFromServerFolder } from './FolderCreatorFromServerFolder';

export class Traverser {
  private readonly collection: ItemsIndexedByPath = {};
  private static readonly ROOT_FOLDER_UUID =
    '43711926-15c2-5ebf-8c24-5099fa9af3c3';

  private rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  } | null = null;

  constructor(
    private readonly decrypt: {
      decryptName: (
        name: string,
        folderId: string,
        encryptVersion: string
      ) => string | null;
    },
    private readonly baseFolderId: number,
    private readonly fileStatusesToFilter: Array<ServerFileStatus>,
    private readonly folderStatusesToFilter: Array<ServerFolderStatus>
  ) {}

  static existingItems(
    decrypt: {
      decryptName: (
        name: string,
        folderId: string,
        encryptVersion: string
      ) => string | null;
    },
    baseFolderId: number
  ): Traverser {
    return new Traverser(
      decrypt,
      baseFolderId,
      [ServerFileStatus.EXISTS],
      [ServerFolderStatus.EXISTS]
    );
  }

  static allItems(
    decrypt: {
      decryptName: (
        name: string,
        folderId: string,
        encryptVersion: string
      ) => string | null;
    },
    baseFolderId: number
  ): Traverser {
    return new Traverser(decrypt, baseFolderId, [], []);
  }

  private traverse(currentId: number, currentName = '') {
    if (!this.rawTree) return;

    const filesInThisFolder = this.rawTree.files.filter(
      (file) => file.folderId === currentId
    );

    const foldersInThisFolder = this.rawTree.folders.filter((folder) => {
      return folder.parentId === currentId;
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

      const relativeFilePath = `${currentName}/${decryptedName}${extensionToAdd}`;

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
          this.collection[relativeFilePath] = file;
        }
      );
    });

    foldersInThisFolder.forEach((folder: ServerFolder) => {
      const plainName =
        folder.plain_name ||
        this.decrypt.decryptName(
          folder.name,
          (folder.parentId as number).toString(),
          '03-aes'
        ) ||
        folder.name;

      const name = `${currentName}/${plainName}`;

      if (!this.folderStatusesToFilter.includes(folder.status)) {
        return;
      }

      EitherTransformer.handleWithEither(() =>
        createFolderFromServerFolder(folder, name)
      ).fold(
        (error) => {
          Logger.warn(
            `[Traverser] Folder with path ${name} could not be created: `,
            error
          );
        },
        (folder) => {
          this.collection[name] = folder;
        }
      );

      if (folder.status === ServerFolderStatus.EXISTS) {
        // The folders and the files from trashed or deleted folders
        // will have the status "EXISTS", to avoid filtering witch folders and files
        // are in a deleted or trashed folder they not included on the collection.
        // We cannot perform any action on them either way
        this.traverse(folder.id, `${name}`);
      }
    });
  }

  public reset() {
    Object.keys(this.collection).forEach(
      (k: string) => delete this.collection[k]
    );

    this.collection['/'] = Folder.from({
      id: this.baseFolderId,
      uuid: Traverser.ROOT_FOLDER_UUID,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  public run(rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  }) {
    this.rawTree = rawTree;

    this.traverse(this.baseFolderId);

    this.collection['/'] = Folder.from({
      id: this.baseFolderId,
      uuid: Traverser.ROOT_FOLDER_UUID,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });

    return this.collection;
  }
}
