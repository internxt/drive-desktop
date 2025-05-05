import Logger from 'electron-log';
import { QueueItem, QueueManager, Callbacks } from '@internxt/node-win/dist';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ProcessIssue } from '../shared/types';
import { ipcRenderer } from 'electron';
import { isTemporaryFile } from '../utils/isTemporalFile';
import { FetchDataService } from './callbacks/fetchData.service';
import { HandleHydrateService } from './callbacks/handleHydrate.service';
import { HandleDehydrateService } from './callbacks/handleDehydrate.service';
import { HandleAddService } from './callbacks/handleAdd.service';
import { HandleChangeSizeService } from './callbacks/handleChangeSize.service';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';
import { getConfig } from './config';
import { logger } from '../shared/logger/logger';
import { Tree } from '@/context/virtual-drive/items/application/Traverser';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

export class BindingsManager {
  progressBuffer = 0;
  controllers: IControllers;

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
      notifyDeleteCallback: (placeholderId: string, callback: (response: boolean) => void) => {
        Logger.debug('Path received from delete callback', placeholderId);
        this.controllers.delete
          .execute(placeholderId)
          .then(() => {
            callback(true);
            void ipcRenderer.invoke('DELETE_ITEM_DRIVE', placeholderId);
          })
          .catch((error: Error) => {
            Logger.error(error);
            callback(false);
          });
      },
      notifyDeleteCompletionCallback: () => {
        Logger.info('Deletion completed');
      },
      notifyRenameCallback: async (absolutePath: string, placeholderId: string, callback: (response: boolean) => void) => {
        try {
          Logger.debug('Path received from rename callback', absolutePath);

          if (this.lastMoved === absolutePath) {
            Logger.debug('Same file moved');
            this.lastMoved = '';
            callback(true);
            return;
          }

          const isTempFile = isTemporaryFile(absolutePath);

          Logger.debug('[isTemporaryFile]', isTempFile);

          if (isTempFile && !placeholderId.startsWith('FOLDER')) {
            Logger.debug('File is temporary, skipping');
            callback(true);
            return;
          }

          const fn = this.controllers.renameOrMove.execute.bind(this.controllers.renameOrMove);
          await fn(absolutePath, placeholderId, callback);
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
      fetchDataCallback: (filePlaceholderId: FilePlaceholderId, callback: CallbackDownload) =>
        this.fetchData.run({
          self: this,
          filePlaceholderId,
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
            action,
            errorName,
            process: 'SYNC',
            kind: 'LOCAL',
          });
        } catch (error) {
          Logger.error(error);
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

    this.stop();

    await this.container.virtualDrive.registerSyncRoot({
      providerName: this.PROVIDER_NAME,
      providerVersion: version,
      callbacks,
      logoPath: this.paths.icon,
    });
    this.container.virtualDrive.connectSyncRoot();

    const tree = await this.container.traverser.run();
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

    const PATHS = await ipcRenderer.invoke('get-paths');

    const queueManager = new QueueManager({
      handlers: callbacks,
      persistPath: PATHS.QUEUE_MANAGER,
    });
    this.container.virtualDrive.watchAndWait({
      queueManager,
    });
    await queueManager.processAll();
  }

  stop() {
    this.container.virtualDrive.disconnectSyncRoot();
  }

  async load(tree: Tree): Promise<void> {
    const addFilePromises = tree.files.map((file) => this.container.fileRepository.add(file));
    const addFolderPromises = tree.folders.map((folder) => this.container.folderRepository.add(folder));
    await Promise.all([addFolderPromises, addFilePromises]);
    logger.debug({ msg: 'In memory repositories loaded', workspaceId: getConfig().workspaceId });
  }

  async update(tree: Tree) {
    Logger.info('[SYNC ENGINE]: Updating placeholders');
    await Promise.all([
      this.container.filesPlaceholderDeleter.run(tree.trashedFiles),
      this.container.folderPlaceholderDeleter.run(tree.trashedFolders),
      this.container.folderPlaceholderUpdater.run(tree.folders),
      this.container.filesPlaceholderUpdater.run(tree.files),
    ]);
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

    void DangledFilesManager.getInstance().pushAndClean(async (input: PushAndCleanInput) => {
      await ipcRenderer.invoke('UPDATE_FIXED_FILES', {
        toUpdate: input.toUpdateContentsIds,
        toDelete: input.toDeleteContentsIds,
      });
    });
  }

  async updateAndCheckPlaceholders(): Promise<void> {
    const workspaceId = getConfig().workspaceId;

    try {
      const tree = await this.container.traverser.run();
      await this.update(tree);
      await this.polling();

      const placeholders = this.container.virtualDrive.getPlaceholderWithStatePending();

      logger.debug({
        msg: 'Update and check placeholders',
        workspaceId,
        total: placeholders.length,
        placeholders,
        attributes: {
          tag: 'SYNC-ENGINE',
        },
      });

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
