import Logger from 'electron-log';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import { ServerFolder } from '../../../../filesystems/domain/ServerFolder';
import { fileNameIsValid } from '../../../../utils/name-verification';
import { WebdavFile } from '../../files/domain/WebdavFile';
import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { ItemsIndexedByPath } from '../domain/ItemsIndexedByPath';

/** @deprecated */
export class Traverser {
  private readonly collection: ItemsIndexedByPath = {};

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
    const foldersInThisFolder = this.rawTree.folders.filter(
      (folder) => folder.parent_id === currentId
    );

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
        const plainName = this.decryptor.decryptName(
          file.name,
          file.folderId.toString(),
          file.encrypt_version
        ) as string;

        this.collection[name] = WebdavFile.from({
          folderId: file.folderId,
          fileId: file.fileId,
          modificationTime: file.modificationTime,
          size: file.size,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
          path: name,
        });
      });

    foldersInThisFolder.forEach((folder: ServerFolder) => {
      const plainName =
        folder.plain_name ||
        this.decryptor.decryptName(
          folder.name,
          (folder.parent_id as number).toString(),
          '03-aes'
        );

      const name = `${currentName}/${plainName}`;

      if (!plainName) return;

      this.collection[name] = WebdavFolder.from({
        id: folder.id,
        parentId: folder.parent_id as number,
        updatedAt: folder.updated_at,
        createdAt: folder.created_at,
        path: name,
      });
      this.traverse(folder.id, `${name}`);
    });
  }

  public reset() {
    Object.keys((k: string) => delete this.collection[k]);

    this.collection['/'] = WebdavFolder.from({
      id: this.baseFolderId,
      parentId: null,
      updatedAt: Date.now().toLocaleString(),
      createdAt: Date.now().toLocaleString(),
      path: '/',
    });
  }

  public run(rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  }) {
    this.rawTree = rawTree;

    this.traverse(this.baseFolderId);

    this.collection['/'] = WebdavFolder.from({
      id: this.baseFolderId,
      parentId: null,
      updatedAt: Date.now().toLocaleString(),
      createdAt: Date.now().toLocaleString(),
      path: '/',
    });

    return this.collection;
  }
}
