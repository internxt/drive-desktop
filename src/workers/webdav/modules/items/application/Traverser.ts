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

export class Traverser {
  private readonly collection: ItemsIndexedByPath = {};
  private static readonly ROOT_FOLDER_UUID =
    '43711926-15c2-5ebf-8c24-5099fa9af3c3';

  private rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
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

    const filesInThisFolder = this.rawTree.files.filter(
      (file) => file.folderId === currentId
    );

    const foldersInThisFolder = this.rawTree.folders.filter((folder) => {
      return folder.parentId === currentId;
    });

    filesInThisFolder
      .map((file) => ({
        name: `${currentName}/${this.decryptor.decryptName(
          file.name,
          file.folderId.toString(),
          file.encrypt_version
        )}${file.type ? `.${file.type}` : ''}`,
        file,
      }))
      .filter(({ name }) => {
        const isValid = fileNameIsValid(name);

        if (!isValid) {
          Logger.warn(
            `REMOTE file with name ${name} will be ignored due an invalid name`
          );
          return false;
        }

        return true;
      })
      .forEach(({ file, name }) => {
        if (file.status === ServerFileStatus.EXISTS) {
          this.collection[name] = File.from({
            folderId: file.folderId,
            contentsId: file.fileId,
            modificationTime: file.modificationTime,
            size: file.size,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt,
            path: name,
            status: file.status,
          });
        }
      });

    foldersInThisFolder.forEach((folder: ServerFolder) => {
      const plainName =
        folder.plain_name ||
        this.decryptor.decryptName(
          folder.name,
          (folder.parentId as number).toString(),
          '03-aes'
        ) ||
        folder.name;

      const name = `${currentName}/${plainName}`;

      if (folder.status !== ServerFolderStatus.EXISTS) return;

      this.collection[name] = Folder.from({
        id: folder.id,
        uuid: folder.uuid,
        parentId: folder.parentId as number,
        updatedAt: folder.updatedAt,
        createdAt: folder.createdAt,
        path: name,
        status: folder.status,
      });

      this.traverse(folder.id, `${name}`);
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
