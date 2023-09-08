import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';
import { Folder } from './modules/folders/domain/Folder';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly rootFolder: string
  ) {}

  private createFolderPlaceholder(folder: Folder) {
    // In order to create a folder placeholder it's path must en with /
    const folderPath = `${folder.path.value}/`;

    this.drive.createItemByPath(folderPath, folder.uuid);
  }

  public async createPlaceHolders() {
    const items = await this.container.treeBuilder.run();

    items.forEach((item) => {
      if (item.isFile()) {
        this.drive.createItemByPath(item.path.value, item.contentsId);
        return;
      }

      this.createFolderPlaceholder(item);
    });
  }

  async start(version: string, providerId: string) {
    await this.drive.unregisterSyncRoot();

    const callbacks = {
      notifyDeleteCallback: (
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        // eslint-disable-next-line no-control-regex
        const sanitazedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        const deleteFn = async () => {
          const files = await this.container.fileSearcher.run();
          const file = files.find((file) => {
            return file.contentsId === sanitazedId;
          });

          if (file) {
            Logger.debug('FILE TO BE DELTED', file.attributes());
            this.container.fileDeleter
              .run(file)
              .then(() => {
                Logger.debug('FILE DELETED: ', file.nameWithExtension);
              })
              .catch((err) => {
                Logger.debug('error deleting', err);
              });
          } else {
            Logger.debug('FILE NOT FOUND');
          }
        };

        deleteFn()
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
        const sanitazedContentsId = contentsId.replace(
          // eslint-disable-next-line no-control-regex
          /[\x00-\x1F\x7F-\x9F]/g,
          ''
        );

        const renameFn = async () => {
          const files = await this.container.fileSearcher.run();
          const file = files.find(
            (file) => file.contentsId === sanitazedContentsId
          );

          if (!file) {
            throw new Error('File not found');
          }

          const relative =
            this.container.filePathFromAbsolutePathCreator.run(absolutePath);

          Logger.debug('NEW PATH', relative.value);

          await this.container.fileRenamer
            .run(file, relative)
            .then(() => Logger.debug('FILE RENAMED / MOVED SUCCESFULLY'))
            .catch((err) => Logger.error(err));
        };

        renameFn()
          .then(() => {
            callback(true);
          })
          .catch((error) => {
            Logger.error(error);
            callback(false);
          });
      },
      notifyFileAddedCallback: async (filePath: string) => {
        Logger.debug('File added', filePath);
      },
      fetchDataCallback: () => {
        Logger.debug('fetchDataCallback');
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
      callbacks
    );

    await this.drive.connectSyncRoot();

    await this.createPlaceHolders();

    this.drive.watchAndWait(this.rootFolder);
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
