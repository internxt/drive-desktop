import { addon } from './addon';
import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';

export class Addon {
  syncRootPath!: string;

  private parseAddonZod<T>(fn: keyof typeof addonZod, data: T) {
    const schema = addonZod[fn];
    const result = schema.safeParse(data);
    if (result.error) console.error(fn, result.error);
    return data;
  }

  registerSyncRoot({
    providerName,
    providerVersion,
    providerId,
    logoPath,
  }: {
    providerName: string;
    providerVersion: string;
    providerId: string;
    logoPath: string;
  }) {
    const result = addon.registerSyncRoot(this.syncRootPath, providerName, providerVersion, providerId, logoPath);
    return this.parseAddonZod('registerSyncRoot', result);
  }

  getRegisteredSyncRoots() {
    const result = addon.getRegisteredSyncRoots();
    return this.parseAddonZod('getRegisteredSyncRoots', result);
  }

  connectSyncRoot({ callbacks }: { callbacks: Callbacks }) {
    const result = addon.connectSyncRoot(this.syncRootPath, callbacks);
    return this.parseAddonZod('connectSyncRoot', result);
  }

  unregisterSyncRoot({ providerId }: { providerId: string }) {
    const result = addon.unregisterSyncRoot(providerId);
    return this.parseAddonZod('unregisterSyncRoot', result);
  }

  disconnectSyncRoot({ syncRootPath }: { syncRootPath: string }) {
    return addon.disconnectSyncRoot(syncRootPath);
  }

  addLogger({ logPath }: { logPath: string }) {
    const result = addon.addLoggerPath(logPath);
    return this.parseAddonZod('addLoggerPath', result);
  }

  getPlaceholderState({ path }: { path: string }) {
    const result = addon.getPlaceholderState(path);
    return this.parseAddonZod('getPlaceholderState', result);
  }

  /**
   * @deprecated
   */
  getPlaceholderWithStatePending() {
    const result = addon.getPlaceholderWithStatePending(this.syncRootPath);
    return this.parseAddonZod('getPlaceholderWithStatePending', result);
  }

  getFileIdentity({ path }: { path: string }) {
    const result = addon.getFileIdentity(path);
    return this.parseAddonZod('getFileIdentity', result);
  }

  async deleteFileSyncRoot({ path }: { path: string }) {
    return addon.deleteFileSyncRoot(path);
  }

  createPlaceholderFile({
    fileName,
    fileId,
    fileSize,
    fileAttributes,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    basePath,
  }: {
    fileName: string;
    fileId: string;
    fileSize: number;
    fileAttributes: number;
    creationTime: string;
    lastWriteTime: string;
    lastAccessTime: string;
    basePath: string;
  }) {
    return addon.createPlaceholderFile(fileName, fileId, fileSize, fileAttributes, creationTime, lastWriteTime, lastAccessTime, basePath);
  }

  createPlaceholderDirectory({
    itemName,
    itemId,
    isDirectory,
    itemSize,
    folderAttributes,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    path,
  }: {
    itemName: string;
    itemId: string;
    isDirectory: boolean;
    itemSize: number;
    folderAttributes: number;
    creationTime: string;
    lastWriteTime: string;
    lastAccessTime: string;
    path: string;
  }) {
    return addon.createEntry(itemName, itemId, isDirectory, itemSize, folderAttributes, creationTime, lastWriteTime, lastAccessTime, path);
  }

  /**
   * @deprecated
   */
  updateSyncStatus({ path, isDirectory, sync }: { path: string; isDirectory: boolean; sync: boolean }) {
    const result = addon.updateSyncStatus(path, sync, isDirectory);
    return this.parseAddonZod('updateSyncStatus', result);
  }

  convertToPlaceholder({ path, id }: { path: string; id: string }) {
    const result = addon.convertToPlaceholder(path, id);
    return this.parseAddonZod('convertToPlaceholder', result);
  }

  updateFileIdentity({ path, id, isDirectory }: { path: string; id: string; isDirectory: boolean }) {
    addon.updateFileIdentity(path, id, isDirectory);
  }

  dehydrateFile({ path }: { path: string }) {
    const result = addon.dehydrateFile(path);
    return this.parseAddonZod('dehydrateFile', result);
  }

  async hydrateFile({ path }: { path: string }) {
    const result = await addon.hydrateFile(path);
    return this.parseAddonZod('hydrateFile', result);
  }
}

export class DependencyInjectionAddonProvider {
  private static _addon: Addon;

  static get() {
    if (DependencyInjectionAddonProvider._addon) return DependencyInjectionAddonProvider._addon;

    DependencyInjectionAddonProvider._addon = new Addon();

    return DependencyInjectionAddonProvider._addon;
  }
}
