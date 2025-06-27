import Logger from 'electron-log';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
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
import { Callbacks } from '@/node-win/types/callbacks.type';
import { QueueItem } from '@/node-win/queue/queueManager';
import { QueueManager } from '@/node-win/queue/queue-manager';
import { getPlaceholdersWithPendingState } from './in/get-placeholders-with-pending-state';
import { iconPath } from '../utils/icon';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

export class BindingsManager {
  progressBuffer = 0;
  controllers: IControllers;

  lastHydrated = '';
  private lastMoved = '';

  constructor(
    public readonly container: DependencyContainer,
    private readonly fetchData = new FetchDataService(),
    private readonly handleHydrate = new HandleHydrateService(),
    private readonly handleDehydrate = new HandleDehydrateService(),
    private readonly handleAdd = new HandleAddService(),
    private readonly handleChangeSize = new HandleChangeSizeService(),
  ) {
    logger.debug({ msg: 'Running sync engine', rootPath: getConfig().rootPath });

    this.controllers = buildControllers(this.container);
  }

  async start() {
    const callbacks: Callbacks = {
      notifyDeleteCallback: (placeholderId, callback) => {
        try {
          logger.debug({
            tag: 'SYNC-ENGINE',
            msg: 'Path received in notifyDeleteCallback',
            placeholderId,
          });

          this.controllers.delete.execute(placeholderId);

          callback(true);
        } catch (error) {
          logger.error({
            tag: 'SYNC-ENGINE',
            msg: 'Error in notifyDeleteCallback',
            placeholderId,
            error,
          });

          callback(false);
        }
      },
      notifyDeleteCompletionCallback: () => {
        Logger.info('Deletion completed');
      },
      notifyRenameCallback: async (
        absolutePath: string,
        placeholderId: FilePlaceholderId | FolderPlaceholderId,
        callback: (response: boolean) => void,
      ) => {
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
      fetchDataCallback: (filePlaceholderId: FilePlaceholderId, callback: CallbackDownload) =>
        this.fetchData.run({
          self: this,
          filePlaceholderId,
          callback,
          ipcRendererSyncEngine,
        }),
      validateDataCallback: () => {
        Logger.debug('validateDataCallback');
      },
      cancelFetchDataCallback: () => {
        this.controllers.downloadFile.cancel();
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

    this.container.virtualDrive.registerSyncRoot({
      providerName: getConfig().providerName,
      providerVersion: INTERNXT_VERSION,
      logoPath: iconPath,
    });

    this.container.virtualDrive.connectSyncRoot({ callbacks });

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
      handleDehydrate: (task: QueueItem) => Promise.resolve(this.handleDehydrate.run({ task, drive: this.container.virtualDrive })),
      handleChangeSize: (task: QueueItem) => this.handleChangeSize.run({ self: this, task }),
    };

    const queueManager = new QueueManager({
      handlers: callbacks,
      persistPath: getConfig().queueManagerPath,
    });

    this.container.virtualDrive.watchAndWait({ queueManager });
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
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Updating placeholders' });
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
      const fileInPendingPaths = await getPlaceholdersWithPendingState({
        virtualDrive: this.container.virtualDrive,
        path: this.container.virtualDrive.syncRootPath,
      });
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

      const placeholders = await getPlaceholdersWithPendingState({
        virtualDrive: this.container.virtualDrive,
        path: this.container.virtualDrive.syncRootPath,
      });

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
