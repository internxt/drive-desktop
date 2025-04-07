import { ServerFile, ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolder, ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { createFileFromServerFile } from '../../files/application/FileCreatorFromServerFile';
import { createFolderFromServerFolder } from '../../folders/application/FolderCreatorFromServerFolder';
import { Folder } from '../../folders/domain/Folder';
import { FolderStatus, FolderStatuses } from '../../folders/domain/FolderStatus';
import { Tree } from '../domain/Tree';
import { CryptoJsNameDecrypt } from '../infrastructure/CryptoJsNameDecrypt';
import { logger } from '@/apps/shared/logger/logger';

const FILE_STATUSES_TO_FILTER = [ServerFileStatus.EXISTS, ServerFileStatus.TRASHED, ServerFileStatus.DELETED];
const FOLDER_STATUSES_TO_FILTER = [ServerFolderStatus.EXISTS, ServerFolderStatus.TRASHED, ServerFolderStatus.DELETED];

type Items = {
  files: Array<ServerFile>;
  folders: Array<ServerFolder>;
};

export class Traverser {
  constructor(
    private readonly decrypt: CryptoJsNameDecrypt,
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
      if (!FILE_STATUSES_TO_FILTER.includes(serverFile.status)) {
        return;
      }

      const decryptedName = this.decrypt.decryptName(serverFile.name, serverFile.folderId.toString(), serverFile.encrypt_version);
      const extensionToAdd = serverFile.type ? `.${serverFile.type}` : '';

      const relativeFilePath = `${currentFolder.path}/${decryptedName}${extensionToAdd}`.replaceAll('//', '/');

      try {
        const file = createFileFromServerFile(serverFile, relativeFilePath);

        if (serverFile.status === ServerFileStatus.DELETED || serverFile.status === ServerFileStatus.TRASHED) {
          tree.appendTrashedFile(file);
        } else {
          tree.addFile(currentFolder, file);
        }
      } catch (exc) {
        logger.error({ msg: 'Error creating file from server file', exc });
      }
    });

    foldersInThisFolder.forEach((serverFolder: ServerFolder) => {
      if (!FOLDER_STATUSES_TO_FILTER.includes(serverFolder.status)) {
        return;
      }

      const plainName =
        serverFolder.plain_name ||
        this.decrypt.decryptName(serverFolder.name, (serverFolder.parentId as number).toString(), '03-aes') ||
        serverFolder.name;

      const name = `${currentFolder.path}/${plainName}`;

      try {
        const folder = createFolderFromServerFolder(serverFolder, name);

        if (serverFolder.status === ServerFolderStatus.DELETED || serverFolder.status === ServerFolderStatus.TRASHED) {
          tree.appendTrashedFolder(folder);
        } else {
          tree.addFolder(currentFolder, folder);
          if (folder.hasStatus(FolderStatuses.EXISTS)) {
            // The folders and the files inside trashed or deleted folders
            // will have the status "EXISTS", to avoid filtering witch folders and files
            // are in a deleted or trashed folder they not included on the collection.
            // We cannot perform any action on them either way
            this.traverse(tree, items, folder);
          }
        }
      } catch (exc) {
        logger.error({ msg: 'Error creating folder from server folder', exc });
      }
    });
  }

  public run(items: Items): Tree {
    const rootFolder = this.createRootFolder();

    const tree = new Tree(rootFolder);

    this.traverse(tree, items, rootFolder);

    return tree;
  }
}
