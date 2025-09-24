import { basename, dirname, join, posix, win32 } from 'path';

import { Addon, DependencyInjectionAddonProvider } from './addon-wrapper';
import { Callbacks } from './types/callbacks.type';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { AbsolutePath, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { iconPath } from '@/apps/utils/icon';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { fileSystem } from '@/infra/file-system/file-system.module';
import { mkdir } from 'fs/promises';

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

  getFileIdentity({ path }: { path: string }) {
    return this.addon.getFileIdentity({ path: this.fixPath(path) });
  }

  connectSyncRoot({ callbacks }: { callbacks: Callbacks }) {
    const connectionKey = this.addon.connectSyncRoot({ callbacks });

    logger.debug({ msg: 'connectSyncRoot', connectionKey });
    return connectionKey;
  }

  disconnectSyncRoot() {
    this.addon.disconnectSyncRoot({ syncRootPath: this.syncRootPath });
  }

  private createPlaceholderFile({
    fileName,
    fileId,
    fileSize,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    basePath,
  }: {
    fileName: string;
    fileId: string;
    fileSize: number;
    creationTime: number;
    lastWriteTime: number;
    lastAccessTime: number;
    basePath: string;
  }) {
    return this.addon.createPlaceholderFile({
      fileName,
      fileId,
      fileSize,
      creationTime,
      lastWriteTime,
      lastAccessTime,
      basePath,
    });
  }

  private createPlaceholderDirectory({
    itemName,
    itemId,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    path,
  }: {
    itemName: string;
    itemId: string;
    creationTime: number;
    lastWriteTime: number;
    lastAccessTime: number;
    path: string;
  }) {
    return this.addon.createPlaceholderDirectory({
      itemName,
      itemId,
      creationTime,
      lastWriteTime,
      lastAccessTime,
      path,
    });
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
    return DependencyInjectionAddonProvider.get().unregisterSyncRoot({ providerId });
  }

  createFileByPath({
    itemPath,
    itemId,
    size,
    creationTime,
    lastWriteTime,
  }: {
    itemPath: RelativePath;
    itemId: FilePlaceholderId;
    size: number;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating file placeholder', itemPath });

    const path = this.fixPath(itemPath);
    const parentPath = dirname(path);

    try {
      this.createPlaceholderFile({
        fileName: basename(itemPath),
        fileId: itemId,
        fileSize: size,
        creationTime,
        lastWriteTime,
        lastAccessTime: Date.now(),
        basePath: parentPath,
      });
    } catch (exc) {
      logger.error({ msg: 'Error creating file placeholder', path, exc });
    }
  }

  createFolderByPath({
    itemPath,
    itemId,
    creationTime,
    lastWriteTime,
  }: {
    itemPath: RelativePath;
    itemId: FolderPlaceholderId;
    creationTime: number;
    lastWriteTime: number;
  }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Creating folder placeholder', itemPath });

    const path = this.fixPath(itemPath);
    const parentPath = dirname(path);

    try {
      this.createPlaceholderDirectory({
        itemName: basename(itemPath),
        itemId,
        creationTime,
        lastWriteTime,
        lastAccessTime: Date.now(),
        path: parentPath,
      });
    } catch (exc) {
      logger.error({ msg: 'Error creating folder placeholder', path, exc });
    }
  }

  updateSyncStatus({ itemPath, isDirectory, sync = true }: { itemPath: string; isDirectory: boolean; sync?: boolean }) {
    return this.addon.updateSyncStatus({ path: this.fixPath(itemPath), isDirectory, sync });
  }

  convertToPlaceholder({ itemPath, id }: { itemPath: string; id: FilePlaceholderId | FolderPlaceholderId }) {
    const result = this.addon.convertToPlaceholder({ path: this.fixPath(itemPath), id });

    if (result.success) {
      logger.debug({
        msg: 'Convert to placeholder succeeded',
        itemPath,
        id,
      });
    } else {
      logger.error({
        msg: 'Convert to placeholder failed',
        itemPath,
        id,
        error: result.errorMessage,
      });
    }

    return result.success;
  }

  dehydrateFile({ itemPath }: { itemPath: string }) {
    return this.addon.dehydrateFile({ path: this.fixPath(itemPath) });
  }

  hydrateFile({ itemPath }: { itemPath: string }) {
    return this.addon.hydrateFile({ path: this.fixPath(itemPath) });
  }
}

export default VirtualDrive;
