import { basename, dirname } from 'node:path';

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
    this.addon.syncRootPath = this.syncRootPath;
  }

  getPlaceholderState({ path }: { path: AbsolutePath }) {
    return this.addon.getPlaceholderState({ path });
  }

  async createSyncRootFolder() {
    const { error } = await fileSystem.stat({ absolutePath: this.syncRootPath });

    if (error) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: error.code });
      await mkdir(this.syncRootPath, { recursive: true });
    }
  }

  connectSyncRoot({ callbacks }: { callbacks: Callbacks }) {
    return this.addon.connectSyncRoot({ callbacks });
  }

  disconnectSyncRoot() {
    return this.addon.disconnectSyncRoot({ syncRootPath: this.syncRootPath });
  }

  registerSyncRoot({ providerName }: { providerName: string }) {
    logger.debug({ msg: 'Registering sync root', syncRootPath: this.syncRootPath });
    return this.addon.registerSyncRoot({
      providerName,
      providerVersion: INTERNXT_VERSION,
      providerId: this.providerId,
      logoPath: iconPath,
    });
  }

  static getRegisteredSyncRoots() {
    return DependencyInjectionAddonProvider.get().getRegisteredSyncRoots();
  }

  static unregisterSyncRoot({ providerId }: { providerId: string }) {
    logger.debug({ msg: 'Unregistering sync root', providerId });
    return DependencyInjectionAddonProvider.get().unregisterSyncRoot({ providerId });
  }

  createFileByPath({
    path,
    placeholderId,
    size,
    creationTime,
    lastWriteTime,
  }: {
    path: AbsolutePath;
    placeholderId: FilePlaceholderId;
    size: number;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating file placeholder', path });

    try {
      return this.addon.createFilePlaceholder({
        name: basename(path),
        placeholderId,
        size,
        creationTime,
        lastWriteTime,
        lastAccessTime: Date.now(),
        parentPath: dirname(path),
      });
    } catch (exc) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error creating file placeholder', path, exc });
    }
  }

  createFolderByPath({
    path,
    placeholderId,
    creationTime,
    lastWriteTime,
  }: {
    path: AbsolutePath;
    placeholderId: FolderPlaceholderId;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating folder placeholder', path });

    try {
      return this.addon.createFolderPlaceholder({
        name: basename(path),
        placeholderId,
        creationTime,
        lastWriteTime,
        lastAccessTime: Date.now(),
        parentPath: dirname(path),
      });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error creating folder placeholder', path, error });
    }
  }

  updateSyncStatus({ path }: { path: AbsolutePath }) {
    return this.addon.updateSyncStatus({ path });
  }

  convertToPlaceholder({ path, id }: { path: AbsolutePath; id: FilePlaceholderId | FolderPlaceholderId }) {
    try {
      this.addon.convertToPlaceholder({ path, id });
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Convert to placeholder succeeded', path, id });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error converting to placeholder', path, error });
    }
  }

  dehydrateFile({ path }: { path: AbsolutePath }) {
    return this.addon.dehydrateFile({ path });
  }

  hydrateFile({ path }: { path: AbsolutePath }) {
    return this.addon.hydrateFile({ path });
  }
}

export default VirtualDrive;
