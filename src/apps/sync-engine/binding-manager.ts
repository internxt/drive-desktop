import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ipcRenderer } from 'electron';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';
import { getConfig } from './config';
import { logger } from '../shared/logger/logger';
import { Tree } from '@/context/virtual-drive/items/application/Traverser';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { updateContentsId } from './callbacks-controllers/controllers/update-contents-id';
import { createWatcher } from './create-watcher';
import { addPendingItems } from './in/add-pending-items';
import { trackRefreshItemPlaceholders } from './track-refresh-item-placeholders';
import { fetchData } from './callbacks/fetchData.service';

export class BindingsManager {
  controllers: IControllers;

  constructor(public readonly container: DependencyContainer) {
    logger.debug({ msg: 'Running sync engine', rootPath: getConfig().rootPath });

    this.controllers = buildControllers(this.container);
  }

  async start() {
    const callbacks: Callbacks = {
      fetchDataCallback: async (filePlaceholderId, callback) => {
        await fetchData({
          self: this,
          filePlaceholderId,
          callback,
        });
      },
      cancelFetchDataCallback: () => {
        this.controllers.downloadFile.cancel();
        logger.debug({ msg: 'cancelFetchDataCallback' });
      },
    };

    this.stop();

    this.container.virtualDrive.registerSyncRoot({
      providerName: getConfig().providerName,
      providerVersion: INTERNXT_VERSION,
    });

    this.container.virtualDrive.connectSyncRoot({ callbacks });

    const tree = await this.container.traverser.run();
    void addPendingItems({ controllers: this.controllers, fileContentsUploader: this.container.contentsUploader, tree });
    await this.load(tree);
    /**
     * Jonathan Arce v2.5.1
     * The goal is to create/update/delete placeholders once the sync engine process spawns,
     * also as we fetch from the backend and after the fetch finish to ensure that all placeholders are right.
     * This one is for the first case, since maybe the sync engine failed in a previous fetching
     * and we have some placeholders pending from being created/updated/deleted
     */
    await trackRefreshItemPlaceholders({ container: this.container });
    setInterval(async () => {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Scheduled refreshing item placeholders', workspaceId: getConfig().workspaceId });
      await trackRefreshItemPlaceholders({ container: this.container });
    }, 60 * 1000);
  }

  watch() {
    const { queueManager, watcher } = createWatcher({
      virtulDrive: this.container.virtualDrive,
      watcherCallbacks: {
        addController: this.controllers.addFile,
        updateContentsId: async ({ stats, path, uuid }) =>
          await updateContentsId({
            virtualDrive: this.container.virtualDrive,
            stats,
            path,
            uuid,
            fileContentsUploader: this.container.contentsUploader,
          }),
      },
    });

    watcher.watchAndWait();

    void this.polling();
    void queueManager.processQueue();
  }

  stop() {
    this.container.virtualDrive.disconnectSyncRoot();
  }

  async load(tree: Tree): Promise<void> {
    const addFilePromises = tree.files.map((file) => this.container.fileRepository.add(file));
    await Promise.all([addFilePromises]);
    logger.debug({ msg: 'In memory repositories loaded', workspaceId: getConfig().workspaceId });
  }

  async polling(): Promise<void> {
    const workspaceId = getConfig().workspaceId;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Polling',
      workspaceId,
    });

    try {
      const tree = await this.container.traverser.run();
      await this.load(tree);
      await this.container.fileDangledManager.run();
    } catch (error) {
      logger.error({ msg: '[SYNC ENGINE] Polling error', workspaceId, error });
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
      await trackRefreshItemPlaceholders({ container: this.container });
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNCED');
    } catch (exc) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error updating and checking placeholder', workspaceId, exc });
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNC_FAILED');
    }
  }
}
