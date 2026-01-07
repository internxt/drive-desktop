import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { addon, Watcher, Win32Path } from './addon';
import { addonZod } from './addon/addon-zod';
import { logger } from '@/apps/shared/logger/logger';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { posix, win32 } from 'node:path';
import { INTERNXT_VERSION } from '@/core/utils/utils';
import { iconPath } from '@/apps/utils/icon';
import { PinState } from './types/placeholder.type';
import { addConnectionKey, cancelFetchDataFn, fetchDataFn } from './callbacks';
import { SyncContext } from '@/apps/sync-engine/config';

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
  static async registerSyncRoot({
    rootPath,
    providerName,
    providerId,
  }: {
    rootPath: AbsolutePath;
    providerName: string;
    providerId: string;
  }) {
    logger.debug({ msg: 'Register sync root', rootPath });
    await addon.registerSyncRoot(toWin32(rootPath), providerName, INTERNXT_VERSION, providerId, iconPath);
  }

  static getRegisteredSyncRoots() {
    const result = addon.getRegisteredSyncRoots();
    return parseAddonZod('getRegisteredSyncRoots', result);
  }

  static connectSyncRoot({ ctx }: { ctx: SyncContext }) {
    const result = addon.connectSyncRoot(toWin32(ctx.rootPath), fetchDataFn, cancelFetchDataFn);
    const connectionKey = parseAddonZod('connectSyncRoot', result);
    addConnectionKey(connectionKey, ctx);
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
    await addon.createFilePlaceholder(toWin32(path), placeholderId, size, creationTime, lastWriteTime);
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
    await addon.createFolderPlaceholder(toWin32(path), placeholderId, creationTime, lastWriteTime);
  }

  static async updateSyncStatus({ path }: { path: AbsolutePath }) {
    await addon.updateSyncStatus(toWin32(path));
  }

  static async convertToPlaceholder({
    path,
    placeholderId,
  }: {
    path: AbsolutePath;
    placeholderId: FilePlaceholderId | FolderPlaceholderId;
  }) {
    await addon.convertToPlaceholder(toWin32(path), placeholderId);
  }

  static async dehydrateFile({ path }: { path: AbsolutePath }) {
    await addon.dehydrateFile(toWin32(path));
  }

  static async hydrateFile({ path }: { path: AbsolutePath }) {
    await addon.hydrateFile(toWin32(path));
  }

  static watchPath({ ctx, onEvent }: { ctx: SyncContext; onEvent: Watcher.OnEvent }) {
    const result = addon.watchPath(toWin32(ctx.rootPath), onEvent);
    return parseAddonZod('watchPath', result);
  }

  static unwatchPath({ handle }: { handle: object }) {
    addon.unwatchPath(handle);
  }
}
