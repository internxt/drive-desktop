import Logger from 'electron-log';
import { FilePlaceholderId } from '../../context/virtual-drive/files/domain/PlaceholderId';
import { IControllers, buildControllers } from './callbacks-controllers/buildControllers';
import { DependencyContainer } from './dependency-injection/DependencyContainer';
import { ipcRendererSyncEngine } from './ipcRendererSyncEngine';
import { ipcRenderer } from 'electron';
import { FetchDataService } from './callbacks/fetchData.service';
import { DangledFilesManager, PushAndCleanInput } from '@/context/virtual-drive/shared/domain/DangledFilesManager';
import { getConfig } from './config';
import { logger } from '../shared/logger/logger';
import { Tree } from '@/context/virtual-drive/items/application/Traverser';
import { Callbacks } from '@/node-win/types/callbacks.type';
import { getPlaceholdersWithPendingState } from './in/get-placeholders-with-pending-state';
import { iconPath } from '../utils/icon';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { updateContentsId } from './callbacks-controllers/controllers/update-contents-id';
import { addPendingFiles } from './in/add-pending-files';
import { createWatcher } from './create-watcher';
import { Watcher } from '@/node-win/watcher/watcher';
import { deleteItemPlaceholders } from '@/backend/features/remote-sync/file-explorer/delete-item-placeholders';
import { loadInMemoryPaths } from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';

export type CallbackDownload = (data: boolean, path: string, errorHandler?: () => void) => Promise<{ finished: boolean; progress: number }>;

export class BindingsManager {
  progressBuffer = 0;
  controllers: IControllers;

  constructor(
    public readonly container: DependencyContainer,
    private readonly fetchData = new FetchDataService(),
  ) {
    logger.debug({ msg: 'Running sync engine', rootPath: getConfig().rootPath });

    this.controllers = buildControllers(this.container);
  }

  async start() {
    const callbacks: Callbacks = {
      fetchDataCallback: (filePlaceholderId: FilePlaceholderId, callback: CallbackDownload) =>
        this.fetchData.run({
          self: this,
          filePlaceholderId,
          callback,
        }),
      cancelFetchDataCallback: () => {
        this.controllers.downloadFile.cancel();
        Logger.debug('cancelFetchDataCallback');
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
  }

  async watch() {
    const { queueManager, watcher } = createWatcher({
      virtulDrive: this.container.virtualDrive,
      watcherCallbacks: {
        addController: this.controllers.addFile,
        updateContentsId: async ({ absolutePath, path, uuid }) =>
          await updateContentsId({
            virtualDrive: this.container.virtualDrive,
            absolutePath,
            path,
            uuid,
            fileContentsUploader: this.container.contentsUploader,
          }),
      },
    });

    watcher.watchAndWait();

    await this.polling({ watcher });
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

  async update(tree: Tree) {
    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Updating placeholders',
      files: tree.files.length,
      folders: tree.folders.length,
      trashedFiles: tree.trashedFiles.length,
      trashedFolders: tree.trashedFolders.length,
    });

    deleteItemPlaceholders({
      remotes: tree.trashedFolders,
      virtualDrive: this.container.virtualDrive,
      isFolder: true,
    });

    deleteItemPlaceholders({
      remotes: tree.trashedFiles,
      virtualDrive: this.container.virtualDrive,
      isFolder: false,
    });

    const { files, folders } = await loadInMemoryPaths({ drive: this.container.virtualDrive });
    await Promise.all([
      this.container.folderPlaceholderUpdater.run({ remotes: tree.folders, folders }),
      this.container.filePlaceholderUpdater.run({ remotes: tree.files, files }),
    ]);
  }

  async polling({ watcher }: { watcher: Watcher }): Promise<void> {
    const workspaceId = getConfig().workspaceId;

    logger.debug({
      tag: 'SYNC-ENGINE',
      msg: 'Polling',
      workspaceId,
    });

    try {
      const absolutePaths = await getPlaceholdersWithPendingState({
        virtualDrive: this.container.virtualDrive,
        path: this.container.virtualDrive.syncRootPath,
      });

      logger.debug({
        tag: 'SYNC-ENGINE',
        msg: 'Files in pending paths',
        workspaceId,
        total: absolutePaths.length,
      });

      await addPendingFiles({ absolutePaths, watcher });

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

      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNCED');
    } catch (exc) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error updating and checking placeholder', workspaceId, exc });
      ipcRendererSyncEngine.send('CHANGE_SYNC_STATUS', workspaceId, 'SYNC_FAILED');
    }
  }
}
