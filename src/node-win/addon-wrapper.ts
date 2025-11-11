import { addon } from './addon';
import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';
import { logger } from '@/apps/shared/logger/logger';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

export class Addon {
  syncRootPath!: string;

  private parseAddonZod<T>(fn: keyof typeof addonZod, data: T) {
    const schema = addonZod[fn];
    const result = schema.safeParse(data);

    if (result.error) {
      logger.error({
        tag: 'SYNC-ENGINE',
        msg: `Error parsing ${fn}`,
        error: result.error,
      });
    }

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

  getPlaceholderState({ path }: { path: string }) {
    const result = addon.getPlaceholderState(path);
    return this.parseAddonZod('getPlaceholderState', result);
  }

  createFilePlaceholder({
    name,
    placeholderId,
    size,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    parentPath,
  }: {
    name: string;
    placeholderId: FilePlaceholderId;
    size: number;
    creationTime: number;
    lastWriteTime: number;
    lastAccessTime: number;
    parentPath: string;
  }) {
    const result = addon.createFilePlaceholder(name, placeholderId, size, creationTime, lastWriteTime, lastAccessTime, parentPath);
    return this.parseAddonZod('createFilePlaceholder', result);
  }

  createFolderPlaceholder({
    name,
    placeholderId,
    creationTime,
    lastWriteTime,
    lastAccessTime,
    parentPath,
  }: {
    name: string;
    placeholderId: FolderPlaceholderId;
    creationTime: number;
    lastWriteTime: number;
    lastAccessTime: number;
    parentPath: string;
  }) {
    const result = addon.createFolderPlaceholder(name, placeholderId, creationTime, lastWriteTime, lastAccessTime, parentPath);
    return this.parseAddonZod('createFolderPlaceholder', result);
  }

  updateSyncStatus({ path }: { path: string }) {
    const result = addon.updateSyncStatus(path);
    return this.parseAddonZod('updateSyncStatus', result);
  }

  convertToPlaceholder({ path, id }: { path: string; id: FilePlaceholderId | FolderPlaceholderId }) {
    const result = addon.convertToPlaceholder(path, id);
    return this.parseAddonZod('convertToPlaceholder', result);
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
  private static _addon?: Addon;

  static get() {
    if (DependencyInjectionAddonProvider._addon) return DependencyInjectionAddonProvider._addon;

    DependencyInjectionAddonProvider._addon = new Addon();

    return DependencyInjectionAddonProvider._addon;
  }
}
