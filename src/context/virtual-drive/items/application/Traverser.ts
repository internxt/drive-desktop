import { Folder } from '../../folders/domain/Folder';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { logger } from '@/apps/shared/logger/logger';
import { File } from '../../files/domain/File';
import { getAllItems } from './RemoteItemsGenerator';
import { createRelativePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { DriveFile } from '@/apps/main/database/entities/DriveFile';
import { DriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { FileErrorHandler } from '../../files/domain/FileError';
import { ipcRendererSyncEngine } from '@/apps/sync-engine/ipcRendererSyncEngine';

type Items = {
  files: Array<DriveFile>;
  folders: Array<DriveFolder>;
};

export type Tree = {
  files: Array<File>;
  folders: Array<Folder>;
  trashedFiles: Array<File>;
  trashedFolders: Array<Folder>;
};

export class Traverser {
  constructor(
    private readonly baseFolderId: number,
    private readonly baseFolderUuid: string,
  ) {}

  private createRootFolder(): Folder {
    return Folder.from({
      id: this.baseFolderId,
      uuid: this.baseFolderUuid,
      parentId: null,
      parentUuid: null,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      path: '/',
      status: FolderStatus.Exists.value,
    });
  }

  private traverse(tree: Tree, items: Items, currentFolder: Folder) {
    if (!items) return;

    const filesInThisFolder = items.files.filter((file) => file.folderUuid === currentFolder.uuid);
    const foldersInThisFolder = items.folders.filter((folder) => folder.parentUuid === currentFolder.uuid);

    filesInThisFolder.forEach((serverFile) => {
      let relativePath: RelativePath | undefined;

      try {
        const decryptedName = File.decryptName({
          plainName: serverFile.plainName,
          name: serverFile.name,
          parentId: serverFile.folderId,
          type: serverFile.type,
        });

        relativePath = createRelativePath(currentFolder.path, decryptedName);

        const file = File.from({
          ...serverFile,
          path: relativePath,
          contentsId: serverFile.fileId,
          size: Number(serverFile.size),
        });

        if (serverFile.status === 'DELETED' || serverFile.status === 'TRASHED') {
          tree.trashedFiles.push(file);
        } else {
          tree.files.push(file);
        }
      } catch (exc) {
        if (relativePath) {
          const name = relativePath;
          FileErrorHandler.handle({
            exc,
            addIssue: ({ code }) => ipcRendererSyncEngine.send('ADD_SYNC_ISSUE', { error: code, name }),
          });
        }

        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error adding file to tree',
          exc,
        });
      }
    });

    foldersInThisFolder.forEach((serverFolder) => {
      try {
        const decryptedName = Folder.decryptName({
          plainName: serverFolder.plainName,
          name: serverFolder.name,
          parentId: serverFolder.parentId,
        });

        const relativePath = createRelativePath(currentFolder.path, decryptedName);

        const folder = Folder.from({
          ...serverFolder,
          parentId: serverFolder.parentId || null,
          parentUuid: serverFolder.parentUuid || null,
          path: relativePath,
        });

        if (serverFolder.status === 'DELETED' || serverFolder.status === 'TRASHED') {
          tree.trashedFolders.push(folder);
        } else {
          tree.folders.push(folder);
          this.traverse(tree, items, folder);
        }
      } catch (exc) {
        /**
         * v2.5.3 Daniel Jiménez
         * TODO: Add issue to sync
         */
        logger.error({
          tag: 'SYNC-ENGINE',
          msg: 'Error adding folder to tree',
          exc,
        });
      }
    });
  }

  async run() {
    const rootFolder = this.createRootFolder();
    const items = await getAllItems();

    const tree: Tree = {
      files: [],
      folders: [rootFolder],
      trashedFiles: [],
      trashedFolders: [],
    };

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
