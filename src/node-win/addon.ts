import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';
import { addon as rawAddon } from '@internxt/node-win/dist';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';

type TAddon = {
  addLoggerPath(path: string): z.infer<typeof addonZod.addLoggerPath>;
  createFilePlaceholder(
    name: string,
    placeholderId: FilePlaceholderId,
    fileSize: number,
    creationTime: number,
    lastWriteTime: number,
    lastAccessTime: number,
    parentPath: string,
  ): z.infer<typeof addonZod.createFilePlaceholder>;
  createFolderPlaceholder(
    name: string,
    placeholderId: FolderPlaceholderId,
    creationTime: number,
    lastWriteTime: number,
    lastAccessTime: number,
    parentPath: string,
  ): z.infer<typeof addonZod.createFolderPlaceholder>;
  hydrateFile(path: string): Promise<z.infer<typeof addonZod.hydrateFile>>;
  dehydrateFile(path: string): z.infer<typeof addonZod.dehydrateFile>;
  connectSyncRoot(path: string, callbacks: Callbacks): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(path: string, id: string): z.infer<typeof addonZod.convertToPlaceholder>;
  getFileIdentity(path: string): z.infer<typeof addonZod.getFileIdentity>;
  disconnectSyncRoot(path: string): z.infer<typeof addonZod.disconnectSyncRoot>;
  getPlaceholderState(path: string): z.infer<typeof addonZod.getPlaceholderState>;
  registerSyncRoot(
    syncRootPath: string,
    providerName: string,
    providerVersion: string,
    providerId: string,
    logoPath: string,
  ): z.infer<typeof addonZod.registerSyncRoot>;
  unregisterSyncRoot(path: string): z.infer<typeof addonZod.unregisterSyncRoot>;
  updateSyncStatus(path: string, isDirectory: boolean): z.infer<typeof addonZod.updateSyncStatus>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
};

export const addon: TAddon = rawAddon;
