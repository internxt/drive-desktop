import Logger from 'electron-log';
import { QueueItem, QueueManager, Callbacks } from 'virtual-drive/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessIssue } from '../shared/types';
import { ipcRenderer } from 'electron';
import { ServerFileStatus } from '../../context/shared/domain/ServerFile';
import { ServerFolderStatus } from '../../context/shared/domain/ServerFolder';
import * as Sentry from '@sentry/electron/renderer';
import { DependencyInjectionLogWatcherPath } from './dependency-injection/common/logEnginePath';
import configStore from '../main/config';
import { isTemporaryFile } from '../utils/isTemporalFile';
import { FetchDataService } from './callbacks/fetchData.service';
import { HandleHydrateService } from './callbacks/handleHydrate.service';
import { HandleDehydrateService } from './callbacks/handleDehydrate.service';
import { HandleAddService } from './callbacks/handleAdd.service';
import { HandleChangeSizeService } from './callbacks/handleChangeSize.service';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

export type FileAddedCallback = (acknowledge: boolean, id: string) => Promise<boolean>;

export class BindingsManager {
  progressBuffer = 0;
  controllers: IControllers;

  private queueManager: QueueManager | null = null;
  lastHydrated = '';
  private lastMoved = '';

  constructor(
    public readonly container: DependencyContainer,
    private readonly paths: {
      root: string;
      icon: string;
    },
    private readonly PROVIDER_NAME: string,
    private readonly fetchData = new FetchDataService(),
    private readonly handleHydrate = new HandleHydrateService(),
    private readonly handleDehydrate = new HandleDehydrateService(),
    private readonly handleAdd = new HandleAddService(),
    private readonly handleChangeSize = new HandleChangeSizeService(),
  ) {
    Logger.info(`Running sync engine ${paths.root}`);

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
      this.container.filesPlaceholderDeleter?.run(tree.trashedFilesList),
      this.container.folderPlaceholderDeleter?.run(tree.trashedFoldersList),
    ]);
  }

  async start(version: string) {
    ipcRendererSyncEngine.send('SYNCING');
    await this.stop();
    await this.pollingStart();

    const callbacks: Callbacks = {
      notifyDeleteCallback: (contentsId: string, callback: (response: boolean) => void) => {
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
      notifyRenameCallback: async (absolutePath: string, contentsId: string, callback: (response: boolean) => void) => {
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
            handler: this.controllers.renameOrMove.execute.bind(this.controllers.renameOrMove),
            fallback: this.controllers.offline.renameOrMove.execute.bind(this.controllers.offline.renameOrMove),
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
      notifyFileAddedCallback: async (absolutePath: string) => {
        Logger.debug('Path received from callback', absolutePath);
        await this.controllers.addFile.execute(absolutePath);
        ipcRenderer.send('CHECK_SYNC');
      },
      fetchDataCallback: (contentsId: FilePlaceholderId, callback: CallbackDownload) =>
        this.fetchData.run({
          self: this,
          contentsId,
          callback,
          ipcRendererSyncEngine,
        }),
      notifyMessageCallback: (
        message: string,
        action: ProcessIssue['action'],
        errorName: ProcessIssue['errorName'],
        callback: (response: boolean) => void,
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

    await this.container.virtualDrive.registerSyncRoot(this.PROVIDER_NAME, version, callbacks, this.paths.icon);

    await this.container.virtualDrive.connectSyncRoot();

    await this.load();
    await this.polling();
    ipcRendererSyncEngine.send('SYNCED');
  }

  async watch() {
    const callbacks = {
      handleAdd: (task: QueueItem) => this.handleAdd.run({ self: this, task, drive: this.container.virtualDrive }),
      handleHydrate: (task: QueueItem) => this.handleHydrate.run({ self: this, task, drive: this.container.virtualDrive }),
      handleDehydrate: (task: QueueItem) => this.handleDehydrate.run({ task, drive: this.container.virtualDrive }),
      handleChangeSize: (task: QueueItem) => this.handleChangeSize.run({ self: this, task }),
    };

    const notify = {
      onTaskSuccess: async () => ipcRendererSyncEngine.send('SYNCED'),
      onTaskProcessing: async () => ipcRendererSyncEngine.send('SYNCING'),
    };

    const persistQueueManager: string = configStore.get('persistQueueManagerPath');

    Logger.debug('persistQueueManager', persistQueueManager);

    const queueManager = new QueueManager(callbacks, notify, persistQueueManager);
    this.queueManager = queueManager;
    const logWatcherPath = DependencyInjectionLogWatcherPath.get();
    this.container.virtualDrive.watchAndWait(this.paths.root, queueManager, logWatcherPath);
    await queueManager.processAll();
  }

  async stop() {
    await this.container.virtualDrive.disconnectSyncRoot();
    this.container.pollingMonitorStop.run();
  }

  async cleanUp() {
    await this.container.virtualDrive.unregisterSyncRoot();
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
      const fileInPendingPaths = (await this.container.virtualDrive.getPlaceholderWithStatePending()) as Array<string>;
      Logger.info('[SYNC ENGINE] fileInPendingPaths', fileInPendingPaths);

      await this.container.fileSyncOrchestrator.run(fileInPendingPaths);
      await this.container.fileDangledManager.run();
    } catch (error) {
      Logger.error('[SYNC ENGINE] Polling', error);
      Sentry.captureException(error);
    }
    ipcRendererSyncEngine.send('SYNCED');

    Logger.debug('[SYNC ENGINE] Polling finished');

    DangledFilesManager.getInstance().pushAndClean(async (input: PushAndCleanInput) => {
          await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
            toUpdate: input.toUpdateContentsIds,
            toDelete: input.toDeleteContentsIds,
          });
        });
  }
  async getFileInSyncPending(): Promise<string[]> {
    try {
      Logger.info('[SYNC ENGINE] Updating unsync files...');

      const fileInPendingPaths = (await this.container.virtualDrive.getPlaceholderWithStatePending()) as Array<string>;
      Logger.info('[SYNC ENGINE] fileInPendingPaths', fileInPendingPaths);

      return fileInPendingPaths;
    } catch (error) {
      Logger.error('[SYNC ENGINE]  Updating unsync files error: ', error);
      Sentry.captureException(error);
      return [];
    }
  }
}
