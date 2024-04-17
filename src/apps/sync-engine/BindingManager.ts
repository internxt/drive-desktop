import Logger from 'electron-log';
import * as fs from 'fs';
import { VirtualDrive } from 'virtual-drive/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { ItemsSearcher } from '../../context/virtual-drive/items/application/ItemsSearcher';
import { PlatformPathConverter } from '../../context/virtual-drive/shared/application/PlatformPathConverter';
import { buildControllers } from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessIssue } from '../shared/types';
import { ipcRenderer } from 'electron';
import { ServerFileStatus } from '../../context/shared/domain/ServerFile';
import { ServerFolderStatus } from '../../context/shared/domain/ServerFolder';
import * as Sentry from '@sentry/electron/renderer';

export type CallbackDownload = (
  success: boolean,
  filePath: string
) => Promise<{ finished: boolean; progress: number }>;

export type FileAddedCallback = (
  acknowledge: boolean,
  id: string
) => Promise<boolean>;

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'PcCloud';
  private progressBuffer = 0;
  constructor(
    private readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {}

  async load(): Promise<void> {
    this.container.existingItemsTreeBuilder.setFilterStatusesToFilter([
      ServerFileStatus.EXISTS,
      ServerFileStatus.TRASHED,
      ServerFileStatus.DELETED,
    ]);

    this.container.existingItemsTreeBuilder.setFolderStatusesToFilter([
      ServerFolderStatus.EXISTS,
      ServerFolderStatus.TRASHED,
      ServerFolderStatus.DELETED,
    ]);

    const tree = await this.container.existingItemsTreeBuilder.run();

    await this.container.folderRepositoryInitiator.run(tree.folders);
    await this.container.foldersPlaceholderCreator.run(tree.folders);

    await this.container.repositoryPopulator.run(tree.files);
    await this.container.filesPlaceholderCreator.run(tree.files);

    await this.container?.filesPlaceholderDeleter?.run(tree.trashedFilesList);
    await this.container?.folderPlaceholderDeleter?.run(
      tree.trashedFoldersList
    );
  }

  async start(version: string, providerId: string) {
    await this.stop();
    await this.pollingStart();

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
            Sentry.captureException(error);
            callback(false);
          });
        ipcRenderer.send('CHECK_SYNC');
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
        ipcRenderer.send('CHECK_SYNC');
      },
      notifyFileAddedCallback: (
        absolutePath: string,
        callback: FileAddedCallback
      ) => {
        Logger.debug('Path received from callback', absolutePath);
        controllers.addFile.execute(absolutePath, callback);
        ipcRenderer.send('CHECK_SYNC');
      },
      fetchDataCallback: async (
        contentsId: FilePlaceholderId,
        callback: CallbackDownload
      ) => {
        try {
          Logger.debug('[Fetch Data Callback] Donwloading begins');
          const path = await controllers.downloadFile.execute(contentsId);
          const file = controllers.downloadFile.fileFinderByContentsId(
            contentsId
              .replace(
                // eslint-disable-next-line no-control-regex
                /[\x00-\x1F\x7F-\x9F]/g,
                ''
              )
              .split(':')[1]
          );
          Logger.debug('[Fetch Data Callback] Preparing begins', path);
          let finished = false;
          try {
            while (!finished) {
              const result = await callback(true, path);
              finished = result.finished;
              Logger.debug('callback result', result);

              if (finished && result.progress === 0) {
                throw new Error('Result progress is 0');
              } else if (this.progressBuffer == result.progress) {
                break;
              } else {
                this.progressBuffer = result.progress;
              }
              Logger.debug('condition', finished);
              ipcRendererSyncEngine.send('FILE_PREPARING', {
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

            await controllers.notifyPlaceholderHydrationFinished.execute(
              contentsId
            );

            await this.container.virtualDrive.closeDownloadMutex();
          } catch (error) {
            Logger.error('notify: ', error);
            Sentry.captureException(error);
            await this.container.virtualDrive.closeDownloadMutex();
          }

          // Esperar hasta que la ejecución de fetchDataCallback esté completa antes de continuar
          await new Promise((resolve) => {
            setTimeout(() => {
              Logger.debug('timeout');
              resolve(true);
            }, 500);
          });

          fs.unlinkSync(path);
          ipcRenderer.send('CHECK_SYNC');
        } catch (error) {
          Logger.error(error);
          Sentry.captureException(error);
          callback(false, '');
        }
      },
      notifyMessageCallback: (
        message: string,
        action: ProcessIssue['action'],
        errorName: ProcessIssue['errorName'],
        callback: (response: boolean) => void
      ) => {
        try {
          callback(true);
          ipcRendererSyncEngine.send('SYNC_INFO_UPDATE', {
            name: message,
            action: action,
            errorName,
            process: 'SYNC',
            kind: 'LOCAL',
          });
          ipcRenderer.send('CHECK_SYNC');
        } catch (error) {
          Logger.error(error);
          Sentry.captureException(error);
          callback(false);
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

    await this.load();

    await this.polling();
  }

  watch() {
    this.container.virtualDrive.watchAndWait(this.paths.root);
  }

  async stop() {
    await this.container.virtualDrive.disconnectSyncRoot();
    this.container.pollingMonitorStop.run();
  }

  async cleanUp() {
    await VirtualDrive.unregisterSyncRoot(this.paths.root);

    const itemsSearcher = new ItemsSearcher();
    const remainingItems = itemsSearcher.listFilesAndFolders(this.paths.root);

    const files = await this.container.retrieveAllFiles.run();
    const folders = await this.container.retrieveAllFolders.run();

    const items = [...files, ...folders];

    const win32AbsolutePaths = items.map((item) => {
      const posixRelativePath = item.path;
      // este path es relativo al root y en formato posix

      const win32RelativePaths =
        PlatformPathConverter.posixToWin(posixRelativePath);

      return this.container.relativePathToAbsoluteConverter.run(
        win32RelativePaths
      );
    });

    Logger.debug('remainingItems', remainingItems);
    Logger.debug('win32AbsolutePaths', win32AbsolutePaths);

    // find all common string in remainingItems and win32AbsolutePaths
    // and delete them
    // const commonItems = remainingItems.filter((item) =>
    //   win32AbsolutePaths.includes(item)
    // );
    // const toDeleteFolder: string[] = [];
    // commonItems.forEach((item) => {
    //   try {
    //     const stat = fs.statSync(item);
    //     if (stat.isDirectory()) {
    //       toDeleteFolder.push(item);
    //     } else if (stat.isFile()) {
    //       fs.unlinkSync(item);
    //     }
    //   } catch (error) {
    //     Logger.error(error);
    //   }
    // });
  }

  async update() {
    Logger.info('[SYNC ENGINE]: Updating placeholders');

    try {
      const tree = await this.container.existingItemsTreeBuilder.run();

      // Delete all the placeholders that are not in the tree
      await this.container?.filesPlaceholderDeleter?.run(tree.trashedFilesList);
      await this.container?.folderPlaceholderDeleter?.run(
        tree.trashedFoldersList
      );

      // Create all the placeholders that are in the tree
      await this.container.folderPlaceholderUpdater.run(tree.folders);
      await this.container.filesPlaceholderUpdater.run(tree.files);
    } catch (error) {
      Logger.error('[SYNC ENGINE] ', error);
      Sentry.captureException(error);
    }
  }

  private async pollingStart() {
    Logger.debug('[SYNC ENGINE] Starting polling');
    return this.container.pollingMonitorStart.run(this.polling.bind(this));
  }

  async polling(): Promise<void> {
    try {
      Logger.info('[SYNC ENGINE] Monitoring polling...');

      const fileInPendingPaths =
        (await this.container.virtualDrive.getPlaceholderWithStatePending()) as Array<string>;
      Logger.info('[SYNC ENGINE] fileInPendingPaths', fileInPendingPaths);

      await this.container.fileSyncOrchestrator.run(fileInPendingPaths);
      ipcRenderer.send('CHECK_SYNC');
    } catch (error) {
      Logger.error('[SYNC ENGINE] Polling', error);
      Sentry.captureException(error);
    }
  }
}
