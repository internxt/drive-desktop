import Logger from 'electron-log';
import * as fs from 'fs';
import { VirtualDrive, QueueItem } from 'virtual-drive/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import {
  IControllers,
  buildControllers,
} from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessIssue } from '../shared/types';
import { ipcRenderer } from 'electron';
import { ServerFileStatus } from '../../context/shared/domain/ServerFile';
import { ServerFolderStatus } from '../../context/shared/domain/ServerFolder';
import * as Sentry from '@sentry/electron/renderer';
import { runner } from '../utils/runner';
import { QueueManager } from './dependency-injection/common/QueueManager';
import { DependencyInjectionLogWatcherPath } from './dependency-injection/common/logEnginePath';
import configStore from '../main/config';
import { FilePath } from '../../context/virtual-drive/files/domain/FilePath';
import { isTemporaryFile } from '../utils/isTemporalFile';

export type CallbackDownload = (
  success: boolean,
  filePath: string
) => Promise<{ finished: boolean; progress: number }>;

export type FileAddedCallback = (
  acknowledge: boolean,
  id: string
) => Promise<boolean>;

export class BindingsManager {
  private static readonly PROVIDER_NAME = 'Internxt';
  private progressBuffer = 0;
  private controllers: IControllers;

  private queueManager: QueueManager | null = null;
  private lastHydrated = '';
  private lastMoved = '';

  constructor(
    private readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      icon: string;
    }
  ) {
    this.controllers = buildControllers(this.container);
  }

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
    await Promise.all([
      this.container.folderRepositoryInitiator.run(tree.folders),
      this.container.foldersPlaceholderCreator.run(tree.folders),
      this.container.repositoryPopulator.run(tree.files),
      this.container.filesPlaceholderCreator.run(tree.files),
      this.container?.filesPlaceholderDeleter?.run(tree.trashedFilesList),
      this.container?.folderPlaceholderDeleter?.run(tree.trashedFoldersList),
    ]);
  }

  async start(version: string, providerId: string) {
    ipcRendererSyncEngine.send('SYNCING');
    await this.stop();
    await this.pollingStart();

    const callbacks = {
      notifyDeleteCallback: (
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        Logger.debug('Path received from delete callback', contentsId);
        this.controllers.delete
          .execute(contentsId)
          .then(() => {
            callback(true);
            ipcRenderer.invoke('DELETE_ITEM_DRIVE', contentsId);
          })
          .catch((error: Error) => {
            Logger.error(error);
            Sentry.captureException(error);
            callback(false);
          });
        ipcRenderer.send('SYNCED');
      },
      notifyDeleteCompletionCallback: () => {
        Logger.info('Deletion completed');
      },
      notifyRenameCallback: async (
        absolutePath: string,
        contentsId: string,
        callback: (response: boolean) => void
      ) => {
        try {
          Logger.debug('Path received from rename callback', absolutePath);

          if (this.lastMoved === absolutePath) {
            Logger.debug('Same file moved');
            this.lastMoved = '';
            callback(true);
            return;
          }

          const isTempFile = await isTemporaryFile(absolutePath);

          Logger.debug('[isTemporaryFile]', isTempFile);

          if (isTempFile && !contentsId.startsWith('FOLDER')) {
            Logger.debug('File is temporary, skipping');
            callback(true);
            return;
          }

          const fn = executeControllerWithFallback({
            handler: this.controllers.renameOrMove.execute.bind(
              this.controllers.renameOrMove
            ),
            fallback: this.controllers.offline.renameOrMove.execute.bind(
              this.controllers.offline.renameOrMove
            ),
          });
          fn(absolutePath, contentsId, callback);
          Logger.debug('Finish Rename', absolutePath);
          this.lastMoved = absolutePath;
        } catch (error) {
          Logger.error('Error during rename or move operation', error);
        }
        ipcRendererSyncEngine.send('SYNCED');
        ipcRenderer.send('CHECK_SYNC');
      },
      notifyFileAddedCallback: async (
        absolutePath: string,
        callback: FileAddedCallback
      ) => {
        Logger.debug('Path received from callback', absolutePath);
        await this.controllers.addFile.execute(absolutePath);
        ipcRenderer.send('CHECK_SYNC');
      },
      fetchDataCallback: async (
        contentsId: FilePlaceholderId,
        callback: CallbackDownload
      ) => {
        try {
          Logger.debug('[Fetch Data Callback] Donwloading begins');
          const startTime = Date.now();
          const path = await this.controllers.downloadFile.execute(
            contentsId,
            callback
          );
          const file = this.controllers.downloadFile.fileFinderByContentsId(
            contentsId
              .replace(
                // eslint-disable-next-line no-control-regex
                /[\x00-\x1F\x7F-\x9F]/g,
                ''
              )
              .split(':')[1]
          );
          Logger.debug('[Fetch Data Callback] Preparing begins', path);
          Logger.debug('[Fetch Data Callback] Preparing begins', file.path);
          this.lastHydrated = file.path;

          let finished = false;
          try {
            while (!finished) {
              const result = await callback(true, path);
              finished = result.finished;
              Logger.debug('callback result', result);

              if (result.progress > 1 || result.progress < 0) {
                throw new Error('Result progress is not between 0 and 1');
              }

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
            // await this.controllers.notifyPlaceholderHydrationFinished.execute(
            //   contentsId
            // );

            const finishTime = Date.now();

            ipcRendererSyncEngine.send('FILE_DOWNLOADED', {
              name: file.name,
              extension: file.type,
              nameWithExtension: file.nameWithExtension,
              size: file.size,
              processInfo: { elapsedTime: finishTime - startTime },
            });
          } catch (error) {
            Logger.error('notify: ', error);
            Sentry.captureException(error);
            // await callback(false, '');
            fs.unlinkSync(path);

            Logger.debug('[Fetch Data Error] Finish...', path);
            return;
          }

          fs.unlinkSync(path);
          try {
            await this.container.fileSyncStatusUpdater.run(file);

            const folderPath = file.path
              .substring(0, file.path.lastIndexOf('/'))
              .replace(/\\/g, '/');

            const folderParentPath = new FilePath(folderPath);

            const folderParent =
              this.container.folderFinder.findFromFilePath(folderParentPath);

            Logger.debug(
              '[Fetch Data Callback] Preparing finish',
              folderParent
            );

            await this.container.folderSyncStatusUpdater.run(folderParent);
          } catch (error) {
            Logger.error('Error updating sync status', error);
          }

          Logger.debug('[Fetch Data Callback] Finish...', path);
        } catch (error) {
          Logger.error(error);
          Sentry.captureException(error);
          await callback(false, '');
          await this.container.virtualDrive.closeDownloadMutex();
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
      cancelFetchDataCallback: async () => {
        await this.controllers.downloadFile.cancel();
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

    await runner([this.load.bind(this), this.polling.bind(this)]);
    ipcRendererSyncEngine.send('SYNCED');
  }

  async watch() {
    const callbacks = {
      handleAdd: async (task: QueueItem) => {
        try {
          Logger.debug('Path received from handle add', task.path);

          const tempFile = await isTemporaryFile(task.path);

          Logger.debug('[isTemporaryFile]', tempFile);

          if (tempFile && !task.isFolder) {
            Logger.debug('File is temporary, skipping');
            return;
          }

          const itemId = await this.controllers.addFile.execute(task.path);
          if (!itemId) {
            Logger.error('Error adding file' + task.path);
            return;
          }
          await this.container.virtualDrive.convertToPlaceholder(
            task.path,
            itemId
          );
          await this.container.virtualDrive.updateSyncStatus(
            task.path,
            task.isFolder,
            true
          );
        } catch (error) {
          Logger.error(`error adding file ${task.path}`);
          Logger.error(error);
          Sentry.captureException(error);
        }
      },
      handleHydrate: async (task: QueueItem) => {
        try {
          const syncRoot = configStore.get('syncRoot');
          Logger.debug('[Handle Hydrate Callback] Preparing begins', task.path);
          const start = Date.now();

          const normalizePath = (path: string) => path.replace(/\\/g, '/');

          const normalizedLastHydrated = normalizePath(this.lastHydrated);
          let normalizedTaskPath = normalizePath(
            task.path.replace(syncRoot, '')
          );

          if (!normalizedTaskPath.startsWith('/')) {
            normalizedTaskPath = '/' + normalizedTaskPath;
          }

          if (normalizedLastHydrated === normalizedTaskPath) {
            Logger.debug('Same file hidrated');
            this.lastHydrated = '';
            return;
          }

          this.lastHydrated = normalizedTaskPath;

          await this.container.virtualDrive.hydrateFile(task.path);

          const finish = Date.now();

          if (finish - start < 1500) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }

          Logger.debug('[Handle Hydrate Callback] Finish begins', task.path);
        } catch (error) {
          Logger.error(`error hydrating file ${task.path}`);
          Logger.error(error);
          Sentry.captureException(error);
        }
      },
      handleDehydrate: async (task: QueueItem) => {
        try {
          Logger.debug('Dehydrate', task);
          await this.container.virtualDrive.dehydrateFile(task.path);
        } catch (error) {
          Logger.error(`error dehydrating file ${task.path}`);
          Logger.error(error);
          Sentry.captureException(error);
        }
      },
      handleChangeSize: async (task: QueueItem) => {
        try {
          Logger.debug('Change size', task);
          await this.container.fileSyncOrchestrator.run([task.path]);
        } catch (error) {
          Logger.error(`error changing size ${task.path}`);
          Logger.error(error);
          Sentry.captureException(error);
        }
      },
    };

    const notify = {
      onTaskSuccess: async () => ipcRendererSyncEngine.send('SYNCED'),
      onTaskProcessing: async () => ipcRendererSyncEngine.send('SYNCING'),
    };

    const persistQueueManager: string = configStore.get(
      'persistQueueManagerPath'
    );

    Logger.debug('persistQueueManager', persistQueueManager);

    const queueManager = new QueueManager(
      callbacks,
      notify,
      persistQueueManager
    );
    this.queueManager = queueManager;
    const logWatcherPath = DependencyInjectionLogWatcherPath.get();
    this.container.virtualDrive.watchAndWait(
      this.paths.root,
      queueManager,
      logWatcherPath
    );
    await queueManager.processAll();
  }

  async stop() {
    await this.container.virtualDrive.disconnectSyncRoot();
    this.container.pollingMonitorStop.run();
  }

  async cleanUp() {
    await VirtualDrive.unregisterSyncRoot(this.paths.root);
  }

  async cleanQueue() {
    if (this.queueManager) {
      this.queueManager.clearQueue();
    }
  }

  async update() {
    Logger.info('[SYNC ENGINE]: Updating placeholders');
    ipcRendererSyncEngine.send('SYNCING');

    try {
      const tree = await this.container.existingItemsTreeBuilder.run();

      await Promise.all([
        // Delete all the placeholders that are not in the tree
        this.container?.filesPlaceholderDeleter?.run(tree.trashedFilesList),
        this.container?.folderPlaceholderDeleter?.run(tree.trashedFoldersList),
        // Create all the placeholders that are in the tree
        this.container.folderPlaceholderUpdater.run(tree.folders),
        this.container.filesPlaceholderUpdater.run(tree.files),
      ]);
      ipcRendererSyncEngine.send('SYNCED');
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
      ipcRendererSyncEngine.send('SYNCING');
      Logger.info('[SYNC ENGINE] Monitoring polling...');
      const fileInPendingPaths =
        (await this.container.virtualDrive.getPlaceholderWithStatePending()) as Array<string>;
      Logger.info('[SYNC ENGINE] fileInPendingPaths', fileInPendingPaths);

      await this.container.fileSyncOrchestrator.run(fileInPendingPaths);
    } catch (error) {
      Logger.error('[SYNC ENGINE] Polling', error);
      Sentry.captureException(error);
    }
    ipcRendererSyncEngine.send('SYNCED');
  }
  async getFileInSyncPending(): Promise<string[]> {
    try {
      Logger.info('[SYNC ENGINE] Updating unsync files...');

      const fileInPendingPaths =
        (await this.container.virtualDrive.getPlaceholderWithStatePending()) as Array<string>;
      Logger.info('[SYNC ENGINE] fileInPendingPaths', fileInPendingPaths);

      return fileInPendingPaths;
    } catch (error) {
      Logger.error('[SYNC ENGINE]  Updating unsync files error: ', error);
      Sentry.captureException(error);
      return [];
    }
  }
}
