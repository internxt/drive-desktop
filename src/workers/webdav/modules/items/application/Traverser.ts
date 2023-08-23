import Logger from 'electron-log';
import {
  ServerFile,
  ServerFileStatus,
} from '../../../../filesystems/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../filesystems/domain/ServerFolder';
import { fileNameIsValid } from '../../../../utils/name-verification';
import { File } from '../../files/domain/File';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { Folder } from '../../folders/domain/Folder';
import { ItemsIndexedByPath } from '../domain/ItemsIndexedByPath';

/** @deprecated */
export class Traverser {
  private readonly collection: ItemsIndexedByPath = {};

  private rawTree: {
    files: Set<ServerFile>;
    folders: Set<ServerFolder>;
  } | null = null;

  constructor(
    private readonly decryptor: {
      decryptName: (
        name: string,
        folderId: string,
        encryptVersion: string
      ) => string | null;
    },
    private readonly baseFolderId: number
  ) {}

  private traverse(currentId: number, currentName = '') {
    if (!this.rawTree) return;

    this.rawTree.files.forEach((file: ServerFile) => {
      if (file.folderId !== currentId) {
        // The file is not on the current folder
        return;
      }

      const rawPath = `${currentName}/${this.decryptor.decryptName(
        file.name,
        file.folderId.toString(),
        file.encrypt_version
      )}${file.type ? `.${file.type}` : ''}`;

      const validRawPath = fileNameIsValid(rawPath);

      if (!validRawPath) {
        Logger.warn(
          `REMOTE file with name ${validRawPath} will be ignored due an invalid name`
        );
        return;
      }

      if (file.status === ServerFileStatus.EXISTS) {
        this.collection[rawPath] = File.from({
          folderId: file.folderId,
          contentsId: file.fileId,
          modificationTime: file.modificationTime,
          size: file.size,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          path: rawPath,
          status: file.status,
        });
      }

      this.rawTree?.files.delete(file);
    });

    this.rawTree.folders.forEach((folder) => {
      if (folder.parentId !== currentId) {
        return;
      }

      const plainName =
        folder.plain_name ||
        this.decryptor.decryptName(
          folder.name,
          (folder.parentId as number).toString(),
          '03-aes'
        ) ||
        folder.name;

      const rawPath = `${currentName}/${plainName}`;

      if (folder.status !== ServerFolderStatus.EXISTS) {
        return;
      }

      this.collection[rawPath] = Folder.from({
        id: folder.id,
        parentId: folder.parentId as number,
        updatedAt: folder.updatedAt,
        createdAt: folder.createdAt,
        path: rawPath,
        status: folder.status,
      });

      this.rawTree?.folders.delete(folder);

      this.traverse(folder.id, rawPath);
    });
  }

  public reset() {
    Object.keys(this.collection).forEach(
      (k: string) => delete this.collection[k]
    );

    this.collection['/'] = Folder.from({
      id: this.baseFolderId,
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
    const filesSet = new Set<ServerFile>();
    const foldersSet = new Set<ServerFolder>();

    // inserting the items with a precached length
    // improves the performance
    const filesLength = rawTree.files.length;
    for (let i = 0; i < filesLength; i++) {
      filesSet.add(rawTree.files[i]);
    }

    const foldersLength = rawTree.folders.length;
    for (let i = 0; i < foldersLength; i++) {
      foldersSet.add(rawTree.folders[i]);
    }

    this.rawTree = {
      files: filesSet,
      folders: foldersSet,
    };

    this.traverse(this.baseFolderId);

    this.collection['/'] = Folder.from({
      id: this.baseFolderId,
      parentId: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });

    return this.collection;
  }
}
