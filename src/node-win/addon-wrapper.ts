import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon as AddonCs } from '@packages/addon-cs';
import { posix, win32 } from 'node:path';
import { logger } from '@/apps/shared/logger/logger';
import { iconPath } from '@/apps/utils/icon';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { addon, Watcher, Win32DevicePath, Win32Path } from './addon';
import { addonZod } from './addon/addon-zod';
import { fetchDataFn } from './callbacks';
import { PinState } from './types/placeholder.type';

export function toWin32Path(path: AbsolutePath) {
  return path.replaceAll(posix.sep, win32.sep) as Win32Path;
}

/**
 * v2.6.9 Daniel Jiménez
 * There is an issue with paths longer than 255 characters and C++ is not able to handle them correctly.
 * Basically it contains a path check and when it has more than 255 characters then it cannot process
 * that path. To skip that check we need to include \\?\ at the beginning of the path. However, there
 * are some functions that do not allow this, like dehydrate or hydrate, so right now, dehydrate and
 * hydrate are broken for paths longer than 255 characters.
 */
function toWin32DevicePath(path: AbsolutePath) {
  return ('\\\\?\\' + toWin32Path(path)) as Win32DevicePath;
}

function parseAddonZod<T>(fn: keyof typeof addonZod, data: T) {
  const schema = addonZod[fn];
  const result = schema.safeParse(data);

  if (result.error) {
    logger.error({
      tag: 'SYNC-ENGINE',
      msg: 'Error parsing addon result',
      fn,
      data,
      error: result.error,
    });
  }

  return data;
}

export class Addon {
  static async registerSyncRoot({
    rootPath,
    providerName,
    providerId,
  }: {
    rootPath: AbsolutePath;
    providerName: string;
    providerId: string;
  }) {
    logger.debug({ msg: 'Register sync root', rootPath, providerId });
    await addon.registerSyncRoot(toWin32Path(rootPath), providerName, INTERNXT_VERSION, providerId, iconPath);
  }

  static getRegisteredSyncRoots() {
    const result = addon.getRegisteredSyncRoots();
    return parseAddonZod('getRegisteredSyncRoots', result);
  }

  static connectSyncRoot({ rootPath }: { rootPath: AbsolutePath }) {
    const result = addon.connectSyncRoot(toWin32Path(rootPath), fetchDataFn);
    const connectionKey = parseAddonZod('connectSyncRoot', result);
    return connectionKey;
  }

  static async unregisterSyncRoot({ providerId }: { providerId: string }) {
    logger.debug({ msg: 'Unregister sync root', providerId });
    await addon.unregisterSyncRoot(providerId);
  }

  static async disconnectSyncRoot({ connectionKey }: { connectionKey: bigint }) {
    await addon.disconnectSyncRoot(connectionKey);
  }

  static async getPlaceholderState({ path }: { path: AbsolutePath }) {
    const result = await addon.getPlaceholderState(toWin32DevicePath(path));
    return parseAddonZod('getPlaceholderState', result);
  }

  static async getFirstNonPlaceholder({ parentPath }: { parentPath: AbsolutePath }) {
    return await addon.getFirstNonPlaceholder(toWin32DevicePath(parentPath));
  }

  static async getSyncRootFromPath({ rootPath }: { rootPath: AbsolutePath }) {
    const result = await addon.getSyncRootFromPath(toWin32Path(rootPath));
    return parseAddonZod('getSyncRootFromPath', result);
  }

  static async updatePlaceholder({ path, placeholderId, size }: { path: AbsolutePath; placeholderId: FilePlaceholderId; size: number }) {
    await addon.updatePlaceholder(toWin32DevicePath(path), placeholderId, size);
  }

  static async setPinState({ path, pinState }: { path: AbsolutePath; pinState: PinState }) {
    await addon.setPinState(toWin32DevicePath(path), pinState);
  }

  static async createFilePlaceholder({
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
    await addon.createFilePlaceholder(toWin32DevicePath(path), placeholderId, size, creationTime, lastWriteTime);
  }

  static async createFolderPlaceholder({
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
    await addon.createFolderPlaceholder(toWin32DevicePath(path), placeholderId, creationTime, lastWriteTime);
  }

  static async updateSyncStatus({ path }: { path: AbsolutePath }) {
    await addon.updateSyncStatus(toWin32DevicePath(path));
  }

  static async convertToPlaceholder({
    path,
    placeholderId,
  }: {
    path: AbsolutePath;
    placeholderId: FilePlaceholderId | FolderPlaceholderId;
  }) {
    await addon.convertToPlaceholder(toWin32DevicePath(path), placeholderId);
  }

  static async dehydrateFile({ path }: { path: AbsolutePath }) {
    await AddonCs.dehydrateFile(toWin32Path(path));
  }

  static async hydrateFile({ path }: { path: AbsolutePath }) {
    await AddonCs.hydrateFile(toWin32Path(path));
  }

  static watchPath({ rootPath, onEvent }: { rootPath: AbsolutePath; onEvent: Watcher.OnEvent }) {
    const result = addon.watchPath(toWin32Path(rootPath), onEvent);
    return parseAddonZod('watchPath', result);
  }

  static unwatchPath({ handle }: { handle: object }) {
    addon.unwatchPath(handle);
  }
}
