import { Addon, DependencyInjectionAddonProvider } from './addon-wrapper';
import { Callbacks } from './types/callbacks.type';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { iconPath } from '@/apps/utils/icon';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mkdir } from 'node:fs/promises';

export class VirtualDrive {
  addon: Addon;
  syncRootPath: AbsolutePath;
  providerId: string;

  constructor({ rootPath, providerId }: { rootPath: AbsolutePath; providerId: string }) {
    this.syncRootPath = rootPath;
    this.providerId = providerId;
    this.addon = new Addon();
  }

  getPlaceholderState(props: { path: AbsolutePath }) {
    return this.addon.getPlaceholderState(props);
  }

  async createSyncRootFolder() {
    const { error } = await fileSystem.stat({ absolutePath: this.syncRootPath });

    if (error) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: error.code });
      await mkdir(this.syncRootPath, { recursive: true });
    }
  }

  connectSyncRoot({ callbacks }: { callbacks: Callbacks }) {
    return this.addon.connectSyncRoot({ rootPath: this.syncRootPath, callbacks });
  }

  disconnectSyncRoot() {
    return this.addon.disconnectSyncRoot({ rootPath: this.syncRootPath });
  }

  registerSyncRoot({ providerName }: { providerName: string }) {
    logger.debug({ msg: 'Registering sync root', rootPath: this.syncRootPath });
    return this.addon.registerSyncRoot({
      rootPath: this.syncRootPath,
      providerName,
      providerVersion: INTERNXT_VERSION,
      providerId: this.providerId,
      logoPath: iconPath,
    });
  }

  static getRegisteredSyncRoots() {
    return DependencyInjectionAddonProvider.get().getRegisteredSyncRoots();
  }

  static unregisterSyncRoot(props: { providerId: string }) {
    return DependencyInjectionAddonProvider.get().unregisterSyncRoot(props);
  }

  createFileByPath(props: {
    path: AbsolutePath;
    placeholderId: FilePlaceholderId;
    size: number;
    creationTime: number;
    lastWriteTime: number;
  }) {
    return this.addon.createFilePlaceholder(props);
  }

  createFolderByPath(props: { path: AbsolutePath; placeholderId: FolderPlaceholderId; creationTime: number; lastWriteTime: number }) {
    return this.addon.createFolderPlaceholder(props);
  }

  updateSyncStatus(props: { path: AbsolutePath }) {
    return this.addon.updateSyncStatus(props);
  }

  convertToPlaceholder(props: { path: AbsolutePath; placeholderId: FilePlaceholderId | FolderPlaceholderId }) {
    return this.addon.convertToPlaceholder(props);
  }

  dehydrateFile(props: { path: AbsolutePath }) {
    return this.addon.dehydrateFile(props);
  }

  hydrateFile(props: { path: AbsolutePath }) {
    return this.addon.hydrateFile(props);
  }
}

export default VirtualDrive;
