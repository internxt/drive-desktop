import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly rootFolder: string
  ) {}

  public async listFiles() {
    const files = await this.container.fileSearcher.run();

    Logger.info(`Creating placehodlers for ${files.length} files`);

    files.forEach((file: File) => {
      Logger.info(`Creating placeholder for ${file.path.value}`);
      this.drive.createItemByPath(file.path.value, file.contentsId);
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

    await this.listFiles();

    this.drive.watchAndWait2(this.rootFolder);
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
