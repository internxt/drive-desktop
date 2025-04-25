import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { createFolderFromServerFolder } from '../../folders/application/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatus } from '../../folders/domain/FolderStatus';
import { logger } from '@/apps/shared/logger/logger';
import { File } from '../../files/domain/File';
import { RemoteItemsGenerator } from './RemoteItemsGenerator';

const FILE_STATUSES_TO_FILTER = [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED, ServerFileStatus.DELETED];
const FOLDER_STATUSES_TO_FILTER = [ServerFolderStatus.EXISTS, ServerFolderStatus.TRASHED, ServerFolderStatus.DELETED];

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
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
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
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
      if (!FILE_STATUSES_TO_FILTER.includes(serverFile.status)) {
        return;
      }

      const decryptedName = File.decryptName({
        plainName: serverFile.plainName,
        name: serverFile.name,
        parentId: serverFile.folderId,
        type: serverFile.type,
      });

      const relativeFilePath = `${currentFolder.path}/${decryptedName}`.replaceAll('//', '/');

      try {
        const file = createFileFromServerFile(serverFile, relativeFilePath);

        if (serverFile.status === ServerFileStatus.DELETED || serverFile.status === ServerFileStatus.TRASHED) {
          tree.trashedFiles.push(file);
        } else {
          tree.files.push(file);
        }
      } catch (exc) {
        logger.error({ msg: 'Error creating file from server file', exc });
      }
    });

    foldersInThisFolder.forEach((serverFolder) => {
      if (!FOLDER_STATUSES_TO_FILTER.includes(serverFolder.status)) {
        return;
      }

      const decryptedName = Folder.decryptName({
        plainName: serverFolder.plain_name,
        name: serverFolder.name,
        parentId: serverFolder.parentId,
      });

      const name = `${currentFolder.path}/${decryptedName}`;

      try {
        const folder = createFolderFromServerFolder(serverFolder, name);

        if (serverFolder.status === ServerFolderStatus.DELETED || serverFolder.status === ServerFolderStatus.TRASHED) {
          tree.trashedFolders.push(folder);
        } else {
          tree.folders.push(folder);
          this.traverse(tree, items, folder);
        }
      } catch (exc) {
        logger.error({ msg: 'Error creating folder from server folder', exc });
      }
    });
  }

  async run() {
    const rootFolder = this.createRootFolder();
    const items = await this.remoteItemsGenerator.getAll();

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
