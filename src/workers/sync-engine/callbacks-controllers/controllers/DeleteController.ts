import Logger from 'electron-log';
import { ChildrenFilesSearcher } from '../../modules/files/application/ChildrenFilesSearcher';
import { FileDeleter } from '../../modules/files/application/FileDeleter';
import { ChildrenFoldersSearcher } from '../../modules/folders/application/ChildrenFoldersSearcher';
import { FolderDeleter } from '../../modules/folders/application/FolderDeleter';
import { Folder } from '../../modules/folders/domain/Folder';
import { DelayQueue } from '../../modules/shared/domain/DelayQueue';
import { CallbackController } from './CallbackController';

export class DeleteController extends CallbackController {
  private readonly filesQueue: DelayQueue;
  private readonly foldersQueue: DelayQueue;

  constructor(
    private readonly fileDeleter: FileDeleter,
    private readonly folderDeleter: FolderDeleter,
    private readonly childrenFilesSearcher: ChildrenFilesSearcher,
    private readonly childrenFoldersSearcher: ChildrenFoldersSearcher
  ) {
    super();

    const deleteFile = async (file: string) => {
      await this.fileDeleter.run(file);
    };

    const deleteFolder = async (folder: string) => {
      try {
        await this.folderDeleter.run(folder);
      } catch (error: unknown) {
        Logger.error(error);

        // If a folder deletion fails, we need to remove the children elements form the queue
        const folders = this.childrenFoldersSearcher.run(folder);
        const foldersUuid = folders.map((folder) => folder.uuid);

        [...foldersUuid, folder]
          .flatMap((uuid) => this.childrenFilesSearcher.run(uuid))
          .forEach((file) => {
            this.filesQueue.dequeue(file.contentsId);
          });

        folders.forEach((folder) => {
          this.foldersQueue.dequeue(folder.uuid);
        });
      }
    };

    const canDeleteFolders = () => {
      // Folders can always be deleted
      return true;
    };

    this.foldersQueue = new DelayQueue(
      'folders',
      deleteFolder,
      canDeleteFolders
    );

    const canDeleteFiles = () => {
      // Files cannot be deleted if there are folders on the queue
      return this.foldersQueue.size === 0;
    };

    this.filesQueue = new DelayQueue('files', deleteFile, canDeleteFiles);
  }

  async execute(contentsId: string) {
    // Gets triggered when a file or folder is deleted or moved to trash.
    // In the case of folders first gets triggered by all the contents of the folder (files and folders).
    // To be able to only delete only the root folder, the files and folders get queued and after a delay
    // the deletion starts by deleting firs the folders in reverse order. The deletion use cases checks
    // if the element has a folder in the upper levels already trashed and if it has it skips the deletion
    // of the element.
    // When folder deletion fails we search all the elements form that node and delete them from the
    // queue.

    const trimmedId = this.trim(contentsId);

    if (this.isFilePlaceholder(trimmedId)) {
      const [_, contentsId] = trimmedId.split(':');
      Logger.debug(`Adding file: ${contentsId} to the trash queue`);
      this.filesQueue.push(contentsId);
      return;
    }

    if (this.isFolderPlaceholder(trimmedId)) {
      const [_, folderUuid] = trimmedId.split(':');
      Logger.debug(`Adding folder: ${folderUuid} to the trash queue`);
      this.foldersQueue.push(folderUuid);
      return;
    }

    if (trimmedId === Folder.ROOT_FOLDER_UUID) {
      throw new Error('Cannot delete root folder');
    }

    throw new Error(`Placeholder Id not identified:  ${trimmedId}`);
  }
}
