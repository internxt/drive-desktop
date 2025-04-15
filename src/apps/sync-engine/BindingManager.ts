import Logger from 'electron-log';
import { QueueItem, QueueManager, Callbacks } from '@internxt/node-win/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { executeControllerWithFallback } from './callbacks-controllers/middlewares/executeControllerWithFallback';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessIssue } from '../shared/types';
import { ipcRenderer } from 'electron';
import * as Sentry from '@sentry/electron/renderer';
import configStore from '../main/config';
import { isTemporaryFile } from '../utils/isTemporalFile';
import { FetchDataService } from './callbacks/fetchData.service';
import { HandleHydrateService } from './callbacks/handleHydrate.service';
import { HandleDehydrateService } from './callbacks/handleDehydrate.service';
import { HandleAddService } from './callbacks/handleAdd.service';
import { HandleChangeSizeService } from './callbacks/handleChangeSize.service';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';
import { getConfig } from './config';
import { logger } from '../shared/logger/logger';
import { Tree } from '@/context/virtual-drive/items/domain/Tree';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

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

  async start(version: string) {
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
      },
      notifyFileAddedCallback: async (absolutePath: string) => {
        Logger.debug('Path received from callback', absolutePath);
        await this.controllers.addFile.execute(absolutePath);
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

    await this.stop();

    await this.container.virtualDrive.registerSyncRoot(this.PROVIDER_NAME, version, callbacks, this.paths.icon);
    await this.container.virtualDrive.connectSyncRoot();

    const tree = await this.container.treeBuilder.run();
    await this.load(tree);
    /**
     * Jonathan Arce v2.5.1
     * The goal is to create/update/delete placeholders once the sync engine process spawns,
     * also as we fetch from the backend and after the fetch finish to ensure that all placeholders are right.
     * This one is for the first case, since maybe the sync engine failed in a previous fetching
     * and we have some placeholders pending from being created/updated/deleted
     */
    await this.update(tree);
    await this.polling();
  }

  async watch() {
    const callbacks = {
      handleAdd: (task: QueueItem) => this.handleAdd.run({ self: this, task, drive: this.container.virtualDrive }),
      handleHydrate: (task: QueueItem) => this.handleHydrate.run({ self: this, task, drive: this.container.virtualDrive }),
      handleDehydrate: (task: QueueItem) => this.handleDehydrate.run({ task, drive: this.container.virtualDrive }),
      handleChangeSize: (task: QueueItem) => this.handleChangeSize.run({ self: this, task }),
    };

    const notify = {
      onTaskSuccess: async () => {
        //ipcRendererSyncEngine.send('SYNCED', getConfig().workspaceId)
      },
      onTaskProcessing: async () => {
        // ipcRendererSyncEngine.send('SYNCING', getConfig().workspaceId);
      },
    };

    const persistQueueManager: string = configStore.get('persistQueueManagerPath');

    Logger.debug('persistQueueManager', persistQueueManager);

    const queueManager = new QueueManager(callbacks, notify, persistQueueManager);
    this.queueManager = queueManager;
    // TODO: remove empty strings, not used
    this.container.virtualDrive.watchAndWait('', queueManager, '');
    await queueManager.processAll();
  }

  stop() {
    this.container.virtualDrive.disconnectSyncRoot();
  }

  async load(tree: Tree): Promise<void> {
    await Promise.all([this.container.folderRepositoryInitiator.run(tree.folders), this.container.repositoryPopulator.run(tree.files)]);
  }

  async update(tree: Tree) {
    Logger.info('[SYNC ENGINE]: Updating placeholders');

    try {
      await Promise.all([
        this.container.filesPlaceholderDeleter.run(tree.trashedFilesList),
        this.container.folderPlaceholderDeleter.run(tree.trashedFoldersList),
        this.container.folderPlaceholderUpdater.run(tree.folders),
        this.container.filesPlaceholderUpdater.run(tree.files),
      ]);
    } catch (error) {
      Logger.error('[SYNC ENGINE] ', error);
      Sentry.captureException(error);
    }
  }

  async polling(): Promise<void> {
    const workspaceId = getConfig().workspaceId;
    logger.debug({ msg: '[SYNC ENGINE] Polling', workspaceId });

    try {
      const fileInPendingPaths = this.container.virtualDrive.getPlaceholderWithStatePending();
      logger.debug({ msg: 'Files in pending paths', workspaceId, total: fileInPendingPaths.length });

      await this.container.fileSyncOrchestrator.run(fileInPendingPaths);
      await this.container.fileDangledManager.run();
    } catch (error) {
      logger.error({ msg: '[SYNC ENGINE] Polling', workspaceId, error });
    }

    logger.debug({ msg: '[SYNC ENGINE] Polling finished', workspaceId });

    DangledFilesManager.getInstance().pushAndClean(async (input: PushAndCleanInput) => {
      await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
        toUpdate: input.toUpdateContentsIds,
        toDelete: input.toDeleteContentsIds,
      });
    });
  }

  async updateAndCheckPlaceholders(): Promise<void> {
    const workspaceId = getConfig().workspaceId;

    try {
      const tree = await this.container.treeBuilder.run();
      await this.update(tree);
      await this.polling();

      const placeholders = this.container.virtualDrive.getPlaceholderWithStatePending();

      if (placeholders.length === 0) {
        ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNCED');
      } else {
        ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNC_PENDING');
      }
    } catch {
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNC_FAILED');
    }
  }
}
