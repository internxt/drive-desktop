import { basename, dirname, join, posix, win32 } from 'node:path';

import { Addon, DependencyInjectionAddonProvider } from './addon-wrapper';
import { Callbacks } from './types/callbacks.type';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { iconPath } from '@/apps/utils/icon';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mkdir } from 'node:fs/promises';

export class VirtualDrive {
  addon: Addon;
  syncRootPath: AbsolutePath;
  providerId: string;

  constructor({ rootPath, providerId, loggerPath }: { rootPath: string; providerId: string; loggerPath: string }) {
    this.syncRootPath = this.convertToWindowsPath({ path: rootPath }) as AbsolutePath;
    this.providerId = providerId;

    this.addon = new Addon();
    this.addon.syncRootPath = this.syncRootPath;
    this.addon.addLogger({ path: this.convertToWindowsPath({ path: loggerPath }) });
  }

  convertToWindowsPath({ path }: { path: string }) {
    return path.replaceAll(posix.sep, win32.sep);
  }

  fixPath(path: string) {
    path = this.convertToWindowsPath({ path });
    if (path.includes(this.syncRootPath)) {
      return path;
    } else {
      return join(this.syncRootPath, path);
    }
  }

  getPlaceholderState({ path }: { path: string }) {
    return this.addon.getPlaceholderState({ path: this.fixPath(path) });
  }

  async createSyncRootFolder() {
    const { error } = await fileSystem.stat({ absolutePath: this.syncRootPath });

    if (error) {
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create sync root folder', code: error.code });
      await mkdir(this.syncRootPath, { recursive: true });
    }
  }

  connectSyncRoot({ callbacks }: { callbacks: Callbacks }) {
    const connectionKey = this.addon.connectSyncRoot({ callbacks });

    logger.debug({ msg: 'connectSyncRoot', connectionKey });
    return connectionKey;
  }

  disconnectSyncRoot() {
    this.addon.disconnectSyncRoot({ syncRootPath: this.syncRootPath });
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
    itemPath,
    placeholderId,
    size,
    creationTime,
    lastWriteTime,
  }: {
    itemPath: RelativePath;
    placeholderId: FilePlaceholderId;
    size: number;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating file placeholder', itemPath });

    const path = this.fixPath(itemPath);

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
    itemPath,
    placeholderId,
    creationTime,
    lastWriteTime,
  }: {
    itemPath: RelativePath;
    placeholderId: FolderPlaceholderId;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating folder placeholder', itemPath });

    const path = this.fixPath(itemPath);

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
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error creating folder placeholder', itemPath, error });
    }
  }

  updateSyncStatus({ itemPath }: { itemPath: string }) {
    return this.addon.updateSyncStatus({ path: this.fixPath(itemPath) });
  }

  convertToPlaceholder({ itemPath, id }: { itemPath: string; id: FilePlaceholderId | FolderPlaceholderId }) {
    try {
      this.addon.convertToPlaceholder({ path: this.fixPath(itemPath), id });
      logger.debug({ tag: 'SYNC-ENGINE', msg: 'Convert to placeholder succeeded', itemPath, id });
    } catch (error) {
      logger.error({ tag: 'SYNC-ENGINE', msg: 'Error converting to placeholder', itemPath, error });
    }
  }

  dehydrateFile({ itemPath }: { itemPath: string }) {
    return this.addon.dehydrateFile({ path: this.fixPath(itemPath) });
  }

  hydrateFile({ itemPath }: { itemPath: string }) {
    return this.addon.hydrateFile({ path: this.fixPath(itemPath) });
  }
}

export default VirtualDrive;
