import { DependencyContainer } from './dependencyInjection/DependencyContainer';
import { File } from './modules/files/domain/File';
import { VirtualDrive } from 'virtual-drive';
import Logger from 'electron-log';
import { promisify } from 'util';
import { EventEmitter } from 'stream';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';
  private readonly eventEmiter;
  constructor(
    private readonly drive: VirtualDrive,
    private readonly container: DependencyContainer,
    private readonly drivePath: string
  ) {
    this.eventEmiter = new EventEmitter();
  }

  public async listFiles() {
    const files = await this.container.fileSearcher.run();

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
      // );ray
    });
  }

  async start(version: string, providerId: string) {
    await this.drive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId
    );

    this.eventEmiter.on('delete-file', async (id) => {
      const files = await this.container.fileSearcher.run();
      const file = files.find((file) => {
        return file.contentsId === id;
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
    });

    await this.drive.connectSyncRoot({
      notifyDeleteCompletionCallback: async (contentsId: string) => {
        this.eventEmiter.emit('delete-file', contentsId);
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

    await this.listFiles();

    promisify(() => this.drive.watchAndWait(this.drivePath));
  }

  async stop() {
    await this.drive.unregisterSyncRoot();
  }
}
