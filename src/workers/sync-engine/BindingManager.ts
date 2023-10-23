import Logger from 'electron-log';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { buildControllers } from './callbacks-controllers/buildControllers';
import { VirtualDrive } from 'virtual-drive/dist';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { FilePlaceholderId } from './modules/placeholders/domain/FilePlaceholderId';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { AbsolutePathToRelativeConverter } from './modules/shared/application/AbsolutePathToRelativeConverter';
import { PlatformPathConverter } from './modules/shared/application/PlatformPathConverter';

export type CallbackDownload = (
  success: boolean,
  filePath: string
) => Promise<{ finished: boolean; progress: number }>;
export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';
  private progressBuffer = 0;
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
            callback(true);
          })
          .catch((error: Error) => {
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
        const fn = executeControllerWithFallback({
          handler: controllers.renameOrMove.execute.bind(
            controllers.renameOrMove
          ),
          fallback: controllers.offline.renameOrMove.execute.bind(
            controllers.offline.renameOrMove
          ),
        });
        fn(absolutePath, contentsId, callback);
      },
      notifyFileAddedCallback: (
        absolutePath: string,
        callback: (acknowledge: boolean, id: string) => boolean
      ) => {
        controllers.addFile.execute(absolutePath, callback);
      },
      fetchDataCallback: async (
        contentsId: FilePlaceholderId,
        callback: CallbackDownload
      ) => {
        try {
          const path = await controllers.downloadFile.execute(
            contentsId,
            callback
          );
          Logger.debug('Execute Fetch Data Callback, sending path:', path);
          const file = controllers.downloadFile.fileFinderByContentsId(
            contentsId
              .replace(
                // eslint-disable-next-line no-control-regex
                /[\x00-\x1F\x7F-\x9F]/g,
                ''
              )
              .split(':')[1]
          );
          let finished = false;
          while (!finished) {
            const result = await callback(true, path);
            finished = result.finished;
            if (this.progressBuffer == result.progress) {
              break;
            } else {
              this.progressBuffer = result.progress;
            }
            Logger.debug('condition', finished);
            ipcRendererSyncEngine.send('FILE_DOWNLOADING', {
              name: file.name,
              extension: file.type,
              nameWithExtension: file.nameWithExtension,
              size: file.size,
              processInfo: {
                elapsedTime: 0,
                progress: result.progress,
              },
            });
          }

          this.progressBuffer = 0;
          try {
            await controllers.notifyPlaceholderHydrationFinished.execute(
              contentsId
            );
          } catch (error) {
            Logger.error('notify: ', error);
          }

          // Esperar hasta que la ejecución de fetchDataCallback esté completa antes de continuar
          await new Promise((resolve) => {
            setTimeout(() => {
              Logger.debug('timeout');
              resolve(true);
            }, 500);
          });
        } catch (error) {
          Logger.error(error);
          callback(false, '');
        }
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

  async cleanUp() {
    await VirtualDrive.unregisterSyncRoot(this.paths.root);

    const files = await this.container.retrieveAllFiles.run();

    const items = [...files];

    const win32AbsolutePaths = items.map((item) => {
      const posixRelativePath = item.path.value;
      // este path es relativo al root y en formato posix

      const win32RelativePaths =
        PlatformPathConverter.posixToWin(posixRelativePath);

      return this.container.relativePathToAbsoluteConverter.run(
        win32RelativePaths
      );
    });

    Logger.debug('items: ', win32AbsolutePaths);
  }
}
