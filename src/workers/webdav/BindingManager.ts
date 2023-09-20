import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';
import { Folder } from './modules/folders/domain/Folder';
import { File } from './modules/files/domain/File';
import { buildControllers } from './app/buildControllers';
import fs from 'fs';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly controllers: ReturnType<typeof buildControllers>,
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {}

  private createFolderPlaceholder(folder: Folder) {
    // In order to create a folder placeholder it's path must en with /
    const folderPath = `${folder.path.value}/`;

    this.drive.createItemByPath(folderPath, folder.uuid);
  }

  public createPlaceHolders(items: Array<File | Folder>) {
    items.forEach((item) => {
      if (item.isFile()) {
        this.drive.createItemByPath(
          item.path.value,
          item.contentsId,
          item.size
        );
        return;
      }

      this.createFolderPlaceholder(item);
    });
  }

  async start(version: string, providerId: string) {
    await this.stop();

    const callbacks = {
      notifyDeleteCallback: (
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        this.controllers.deleteFile
          .execute(contentsId)
          .then(() => {
            callback(true);
          })
          .catch((error) => {
            Logger.error(error);
            callback(false);
          });
      },
      notifyDeleteCompletionCallback: () => {
        Logger.info('Deletion completed');
      },
      notifyRenameCallback: (
        absolutePath: string,
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        this.controllers.renameOrMoveFile
          .execute(absolutePath, contentsId)
          .then(() => {
            callback(true);
          })
          .catch((error) => {
            Logger.error(error);
            callback(false);
          });
      },
      notifyFileAddedCallback: (absolutePath: string) => {
        const dehydrateAndCreatePlaceholder = (
          id: string,
          relative: string,
          size: number
        ) => {
          fs.unlinkSync(absolutePath);
          this.drive.createItemByPath(relative, id, size);
        };

        this.controllers.addFile.execute(
          absolutePath,
          dehydrateAndCreatePlaceholder
        );
      },
      fetchDataCallback: (
        contentsId: string,
        callback: (success: boolean, path: string) => void
      ) => {
        this.controllers.downloadFile
          .execute(contentsId)
          .then((path) => {
            callback(true, path);
          })
          .catch((error) => {
            Logger.error('Fetch Data Callback:', error);
            callback(false, '');
          });
      },
      validateDataCallback: () => {
        Logger.debug('validateDataCallback');
      },
      cancelFetchDataCallback: () => {
        Logger.debug('cancelFetchDataCallback');
      },
      fetchPlaceholdersCallback: () => {
        Logger.debug('fetchPlaceholdersCallback');
      },
      cancelFetchPlaceholdersCallback: () => {
        Logger.debug('cancelFetchPlaceholdersCallback');
      },
      notifyFileOpenCompletionCallback: () => {
        Logger.debug('notifyFileOpenCompletionCallback');
      },
      notifyFileCloseCompletionCallback: () => {
        Logger.debug('notifyFileCloseCompletionCallback');
      },
      notifyDehydrateCallback: () => {
        Logger.debug('notifyDehydrateCallback');
      },
      notifyDehydrateCompletionCallback: () => {
        Logger.debug('notifyDehydrateCompletionCallback');
      },
      notifyRenameCompletionCallback: () => {
        Logger.debug('notifyRenameCompletionCallback');
      },
      noneCallback: () => {
        Logger.debug('noneCallback');
      },
    };

    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId,
      callbacks,
      this.paths.icon
    );

    await this.drive.connectSyncRoot();
  }

  watch() {
    this.drive.watchAndWait(this.paths.root);
  }

  async stop() {
    await this.drive.disconnectSyncRoot();
    await this.drive.unregisterSyncRoot();
  }
}
