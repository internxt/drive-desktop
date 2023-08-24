import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';
import { promisify } from 'util';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly drivePath: string
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

  async start(version: string, providerId: string) {
    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    const files = this.container.fileSearcher.run();

    await this.drive.connectSyncRoot({
      notifyDeleteCompletionCallback: async (...params) => {
        const file = files.find((file) => {
          return file.contentsId.includes(params[0]);
        });

        if (file) {
          Logger.debug('FILE TO BE DELTED', file.attributes());
          this.container.fileDeleter
            .run(file)
            .then(() => {
              Logger.debug('FILE DELTED');
            })
            .catch((err) => {
              Logger.debug('error deleting', err);
            });
        } else {
          Logger.debug('FILE NOT FOUND');
        }
      },
      notifyDeleteCallback: (...parms) => {
        Logger.debug('notifyDeleteCallback', parms);
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
      notifyRenameCallback: () => {
        Logger.debug('notifyRenameCallback');
      },
      notifyRenameCompletionCallback: () => {
        Logger.debug('notifyRenameCompletionCallback');
      },
      noneCallback: () => {
        Logger.debug('noneCallback');
      },
    });

    this.listFiles();

    promisify(() => this.drive.watchAndWait(this.drivePath));
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
