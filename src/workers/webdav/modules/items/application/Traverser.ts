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
import { WebdavFile } from '../../files/domain/WebdavFile';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
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

      if (file.status !== ServerFileStatus.EXISTS) {
        return;
      }

      this.collection[rawPath] = WebdavFile.from({
        folderId: file.folderId,
        fileId: file.fileId,
        modificationTime: file.modificationTime,
        size: file.size,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        path: rawPath,
        status: file.status,
      });

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

      this.collection[rawPath] = WebdavFolder.from({
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

    this.collection['/'] = WebdavFolder.from({
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
    this.rawTree = {
      files: new Set(rawTree.files),
      folders: new Set(rawTree.folders),
    };

    this.traverse(this.baseFolderId);

    this.collection['/'] = WebdavFolder.from({
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
