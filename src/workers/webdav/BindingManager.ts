import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import { VirtualDrive } from 'virtual-drive/dist';
import Logger from 'electron-log';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
  ) {}

  private listFiles() {
    const files = this.container.fileSearcher.run();

    files.forEach((file: File) => {
      this.drive.createItemByPath(file.path.value, file.contentsId);
      // this.drive.createPlaceholderFile(
      // file.nameWithExtension,
      //   file.contentsId,
      //   file.size,
      //   this.drive.PLACEHOLDER_ATTRIBUTES.FILE_ATTRIBUTE_READONLY,
      //   file.createdAt.getUTCMilliseconds(),
      //   file.updatedAt.getUTCMilliseconds(),
      //   file.updatedAt.getUTCMilliseconds(),
      //   // This should be the last access time but we don't store the last accessed time
      //   path.join(this.drivePath, file.path.value);
      // );
    });
  }

  async up(version: string, providerId: string) {
    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    await this.drive.connectSyncRoot({
      notifyDeleteCompletionCallback: () => {
        Logger.debug('Delete completed');
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
    notifyDeleteCallback: () => {
      Logger.debug('notifyDeleteCallback');
    },
    notifyRenameCallback: () => {
      Logger.debug('notifyRenameCallback');
    },
    notifyRenameCompletionCallback: () => {
      Logger.debug('notifyRenameCompletionCallback');
    },
    noneCallback: () => {
      Logger.debug('noneCallback');
    }
    });

    this.listFiles();

    // this.drive.watchAndWait(this.drivePath);
  }

  async down() {
    Logger.debug('GOING DOWN');
    await this.drive.unregisterSyncRoot();
  }
}
