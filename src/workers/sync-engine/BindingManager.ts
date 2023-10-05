import Logger from 'electron-log';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { buildControllers } from './callbacks-controllers/buildControllers';

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';

  constructor(
    private readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {}

  async start(version: string, providerId: string) {
    await this.stop();

    const controllers = buildControllers(this.container);

    const callbacks = {
      notifyDeleteCallback: (
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        controllers.delete
          .execute(contentsId)
          .then(() => {
            Logger.debug('DELETE RESPONSE SUCCESSFUL');
            callback(true);
          })
          .catch((error: Error) => {
            Logger.debug('DELETE RESPONSE NOT SUCCESSFUL');
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
        controllers.renameOrMoveFile.execute(
          absolutePath,
          contentsId,
          callback
        );
      },
      notifyFileAddedCallback: (
        absolutePath: string,
        callback: (acknowledge: boolean, id: string) => boolean
      ) => {
        controllers.addFile.execute(absolutePath, callback);
      },
      fetchDataCallback: (
        contentsId: string,
        callback: (data: boolean, path: string) => boolean
      ) => {
        controllers.downloadFile
          .execute(contentsId, callback)
          .then((path: string) => {
            Logger.debug('Execute Fetch Data Callback, sending path:', path);

            let finished = false;
            while (!finished) {
              //callback returns true or void ( never return false , this will be resolved in the future )
              finished = callback(true, path);
              Logger.debug('condition', finished);
            }
          })
          .catch((error: Error) => {
            Logger.error('Error Fetch Data Callback:', error);
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

    await this.container.virtualDrive.registerSyncRoot(
      BindingsManager.PROVIDER_NAME,
      version,
      providerId,
      callbacks,
      this.paths.icon
    );

    await this.container.virtualDrive.connectSyncRoot();
  }

  watch() {
    this.container.virtualDrive.watchAndWait(this.paths.root);
  }

  async stop() {
    await this.container.virtualDrive.disconnectSyncRoot();
  }
}
