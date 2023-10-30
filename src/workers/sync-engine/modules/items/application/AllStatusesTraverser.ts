import Logger from 'electron-log';
import { ServerFile } from '../../../../filesystems/domain/ServerFile';
import {
  ServerFolder,
  ServerFolderStatus,
} from '../../../../filesystems/domain/ServerFolder';
import { fileNameIsValid } from '../../../../utils/name-verification';
import { File } from '../../files/domain/File';
import { Folder } from '../../folders/domain/Folder';
import { ItemsIndexedByPath } from '../domain/ItemsIndexedByPath';
import { EitherTransformer } from '../../shared/application/EitherTransformer';
import { Traverser } from '../domain/Traverser';

function fileFromServerFile(relativePath: string, server: ServerFile): File {
  return File.from({
    folderId: server.folderId,
    contentsId: server.fileId,
    modificationTime: server.modificationTime,
    size: server.size,
    createdAt: server.createdAt,
    updatedAt: server.updatedAt,
    path: relativePath,
    status: server.status,
  });
}

export class AllStatusesTraverser implements Traverser {
  private readonly collection: ItemsIndexedByPath = {};
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
        name: `${currentName}/${this.decrypt.decryptName(
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
        EitherTransformer.handleWithEither(() =>
          fileFromServerFile(name, file)
        ).fold(
          (error) => {
            Logger.warn(
              `[Traverser] File with path ${name} could not be created: `,
              error
            );
          },
          (file) => {
            this.collection[name] = file;
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

      this.collection[name] = Folder.from({
        id: folder.id,
        uuid: folder.uuid,
        parentId: folder.parentId as number,
        updatedAt: folder.updatedAt,
        createdAt: folder.createdAt,
        path: name,
        status: folder.status,
      });

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
  }

  public run(rawTree: {
    files: Array<ServerFile>;
    folders: Array<ServerFolder>;
  }) {
    this.rawTree = rawTree;

    this.traverse(this.baseFolderId);

    return this.collection;
  }
}
