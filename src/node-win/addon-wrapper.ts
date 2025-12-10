import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { addon, Win32Path } from './addon';
import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';
import { logger } from '@/apps/shared/logger/logger';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { posix, win32 } from 'node:path';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { iconPath } from '@/apps/utils/icon';
import { PinState } from './types/placeholder.type';

function toWin32(path: AbsolutePath) {
  return path.replaceAll(posix.sep, win32.sep) as Win32Path;
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
  static registerSyncRoot({ rootPath, providerName, providerId }: { rootPath: AbsolutePath; providerName: string; providerId: string }) {
    logger.debug({ msg: 'Register sync root', rootPath });
    addon.registerSyncRoot(toWin32(rootPath), providerName, INTERNXT_VERSION, providerId, iconPath);
  }

  static getRegisteredSyncRoots() {
    const result = addon.getRegisteredSyncRoots();
    return parseAddonZod('getRegisteredSyncRoots', result);
  }

  static connectSyncRoot({ rootPath, callbacks }: { rootPath: AbsolutePath; callbacks: Callbacks }) {
    const result = addon.connectSyncRoot(toWin32(rootPath), callbacks);
    return parseAddonZod('connectSyncRoot', result);
  }

  static async unregisterSyncRoot({ providerId }: { providerId: string }) {
    logger.debug({ msg: 'Unregister sync root', providerId });
    const result = await addon.unregisterSyncRoot(providerId);
    return parseAddonZod('unregisterSyncRoot', result);
  }

  static async disconnectSyncRoot({ rootPath }: { rootPath: AbsolutePath }) {
    const result = await addon.disconnectSyncRoot(toWin32(rootPath));
    return parseAddonZod('disconnectSyncRoot', result);
  }

  static async getPlaceholderState({ path }: { path: AbsolutePath }) {
    const result = await addon.getPlaceholderState(toWin32(path));
    return parseAddonZod('getPlaceholderState', result);
  }

  static async updatePlaceholder({ path, placeholderId, size }: { path: AbsolutePath; placeholderId: FilePlaceholderId; size: number }) {
    await addon.updatePlaceholder(toWin32(path), placeholderId, size);
  }

  static async setPinState({ path, pinState }: { path: AbsolutePath; pinState: PinState }) {
    await addon.setPinState(toWin32(path), pinState);
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
    const result = await addon.createFilePlaceholder(toWin32(path), placeholderId, size, creationTime, lastWriteTime);
    return parseAddonZod('createFilePlaceholder', result);
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
    const result = await addon.createFolderPlaceholder(toWin32(path), placeholderId, creationTime, lastWriteTime);
    return parseAddonZod('createFolderPlaceholder', result);
  }

  static async updateSyncStatus({ path }: { path: AbsolutePath }) {
    const result = await addon.updateSyncStatus(toWin32(path));
    return parseAddonZod('updateSyncStatus', result);
  }

  static async convertToPlaceholder({
    path,
    placeholderId,
  }: {
    path: AbsolutePath;
    placeholderId: FilePlaceholderId | FolderPlaceholderId;
  }) {
    const result = await addon.convertToPlaceholder(toWin32(path), placeholderId);
    return parseAddonZod('convertToPlaceholder', result);
  }

  static async dehydrateFile({ path }: { path: AbsolutePath }) {
    const result = await addon.dehydrateFile(toWin32(path));
    return parseAddonZod('dehydrateFile', result);
  }

  static async hydrateFile({ path }: { path: AbsolutePath }) {
    const result = await addon.hydrateFile(toWin32(path));
    return parseAddonZod('hydrateFile', result);
  }
}
