import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { addon, Win32Path } from './addon';
import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';
import { logger } from '@/apps/shared/logger/logger';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { posix, win32 } from 'node:path';

function toWin32(path: AbsolutePath) {
  return path.replaceAll(posix.sep, win32.sep) as Win32Path;
}

export class Addon {
  private parseAddonZod<T>(fn: keyof typeof addonZod, data: T) {
    const schema = addonZod[fn];
    const result = schema.safeParse(data);

    if (result.error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: 'Error parsing addon result',
        fn,
        error: result.error,
      });
    }

    return data;
  }

  registerSyncRoot({
    rootPath,
    providerName,
    providerVersion,
    providerId,
    logoPath,
  }: {
    rootPath: AbsolutePath;
    providerName: string;
    providerVersion: string;
    providerId: string;
    logoPath: string;
  }) {
    const result = addon.registerSyncRoot(toWin32(rootPath), providerName, providerVersion, providerId, logoPath);
    return this.parseAddonZod('registerSyncRoot', result);
  }

  getRegisteredSyncRoots() {
    const result = addon.getRegisteredSyncRoots();
    return this.parseAddonZod('getRegisteredSyncRoots', result);
  }

  connectSyncRoot({ rootPath, callbacks }: { rootPath: AbsolutePath; callbacks: Callbacks }) {
    const result = addon.connectSyncRoot(toWin32(rootPath), callbacks);
    return this.parseAddonZod('connectSyncRoot', result);
  }

  unregisterSyncRoot({ providerId }: { providerId: string }) {
    logger.debug({ msg: 'Unregister sync root', providerId });
    const result = addon.unregisterSyncRoot(providerId);
    return this.parseAddonZod('unregisterSyncRoot', result);
  }

  disconnectSyncRoot({ rootPath }: { rootPath: AbsolutePath }) {
    return addon.disconnectSyncRoot(toWin32(rootPath));
  }

  getPlaceholderState({ path }: { path: AbsolutePath }) {
    const result = addon.getPlaceholderState(toWin32(path));
    return this.parseAddonZod('getPlaceholderState', result);
  }

  createFilePlaceholder({
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
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create file placeholder', path });
    const result = addon.createFilePlaceholder(toWin32(path), placeholderId, size, creationTime, lastWriteTime);
    return this.parseAddonZod('createFilePlaceholder', result);
  }

  createFolderPlaceholder({
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
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Create folder placeholder', path });
    const result = addon.createFolderPlaceholder(toWin32(path), placeholderId, creationTime, lastWriteTime);
    return this.parseAddonZod('createFolderPlaceholder', result);
  }

  updateSyncStatus({ path }: { path: AbsolutePath }) {
    const result = addon.updateSyncStatus(toWin32(path));
    return this.parseAddonZod('updateSyncStatus', result);
  }

  convertToPlaceholder({ path, placeholderId }: { path: AbsolutePath; placeholderId: FilePlaceholderId | FolderPlaceholderId }) {
    logger.debug({ tag: 'SYNC-ENGINE', msg: 'Convert to placeholder', path, placeholderId });
    const result = addon.convertToPlaceholder(toWin32(path), placeholderId);
    return this.parseAddonZod('convertToPlaceholder', result);
  }

  dehydrateFile({ path }: { path: AbsolutePath }) {
    const result = addon.dehydrateFile(toWin32(path));
    return this.parseAddonZod('dehydrateFile', result);
  }

  async hydrateFile({ path }: { path: AbsolutePath }) {
    const result = await addon.hydrateFile(toWin32(path));
    return this.parseAddonZod('hydrateFile', result);
  }
}

export class DependencyInjectionAddonProvider {
  private static _addon?: Addon;

  static get() {
    if (DependencyInjectionAddonProvider._addon) return DependencyInjectionAddonProvider._addon;

    DependencyInjectionAddonProvider._addon = new Addon();

    return DependencyInjectionAddonProvider._addon;
  }
}
