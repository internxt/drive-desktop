import Logger from 'electron-log';
import { getSecondsFromDateString } from '../utils/date';
import { fileNameIsValid } from '../utils/name-verification';
import { ServerFile } from '../filesystems/domain/ServerFile';
import { ServerFolder } from '../filesystems/domain/ServerFolder';
import crypt from '../utils/crypt';

type Cache = Record<
  string,
  {
    id: number;
    parentId: number;
    isFolder: boolean;
    bucket: string | null;
    fileId?: string;
    folderId?: number;
    modificationTime?: number;
    size?: number;
  }
>;

export class RemoteFilesTraverser {
  private readonly cache: Cache = {};

  private rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  } | null = null;

  constructor(private readonly baseFolderId: number) {}

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
        name:
          currentName +
          crypt.decryptName(
            file.name,
            file.folderId.toString(),
            file.encrypt_version
          ) +
          (file.type ? `.${file.type}` : ''),
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
        const modificationTime = getSecondsFromDateString(
          file.modificationTime
        );
        this.cache[name] = {
          id: file.id,
          parentId: file.folderId,
          isFolder: false,
          bucket: file.bucket,
          fileId: file.fileId,
          modificationTime,
          size: file.size,
        };
      });

    foldersInThisFolder.forEach((folder: ServerFolder) => {
      const plainName =
        folder.plain_name ||
        crypt.decryptName(
          folder.name,
          (folder.parent_id as number).toString(),
          '03-aes'
        );

      const name = currentName + plainName;

      this.cache[name] = {
        id: folder.id,
        parentId: folder.parent_id as number,
        isFolder: true,
        bucket: folder.bucket,
      };
      this.traverse(folder.id, `${name}/`);
    });
  }

  public run(rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  }) {
    this.rawTree = rawTree;
    this.traverse(this.baseFolderId);

    return this.cache;
  }
}
