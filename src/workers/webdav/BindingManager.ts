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

    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    await this.drive.connectSyncRoot({
      notifyDeleteCallback: async (contentsId: string) => {
        // eslint-disable-next-line no-control-regex
        const sanitazedId = contentsId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

        try {
          await this.container.fileDeleter.run(sanitazedId);
          return true;
        } catch (error) {
          Logger.error(`Error deleting file ${contentsId}`);
          return false;
        }
      },
      notifyDeleteCompletionCallback: (...params) => {
        Logger.debug('notifyDeleteCallback', params);
      },
      notifyRenameCallback: async (
        absolutePath: string,
        contentsId: string
      ) => {
        const sanitazedContentsId = contentsId.replace(
          // eslint-disable-next-line no-control-regex
          /[\x00-\x1F\x7F-\x9F]/g,
          ''
        );
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
    });

    await this.createPlaceHolders();

    this.drive.watchAndWait2(this.rootFolder);
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
