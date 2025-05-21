import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { InputSyncCallbacks } from './types/callbacks.type';
import { addon as rawAddon } from '@internxt/node-win/dist';

export const addon: TAddon = rawAddon;

export type TAddon = {
  addLoggerPath(path: string): z.infer<typeof addonZod.addLoggerPath>;
  createPlaceholderFile(
    fileName: string,
    fileId: string,
    fileSize: number,
    fileAttributes: number,
    creationTime: string,
    lastWriteTime: string,
    lastAccessTime: string,
    path: string,
  ): any;
  createEntry(
    itemName: string,
    itemId: string,
    isDirectory: boolean,
    itemSize: number,
    fileAttributes: number,
    creationTime: string,
    lastWriteTime: string,
    lastAccessTime: string,
    path: string,
  ): any;
  hydrateFile(path: string): Promise<z.infer<typeof addonZod.hydrateFile>>;
  dehydrateFile(path: string): z.infer<typeof addonZod.dehydrateFile>;
  connectSyncRoot(path: string, callbacks: InputSyncCallbacks): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(path: string, id: string): z.infer<typeof addonZod.convertToPlaceholder>;
  deleteFileSyncRoot(path: string): any;
  getFileIdentity(path: string): z.infer<typeof addonZod.getFileIdentity>;
  /**
   * TODO: Not all paths return value
   */
  disconnectSyncRoot(path: string): unknown;
  getPlaceholderState(path: string): z.infer<typeof addonZod.getPlaceholderState>;
  getPlaceholderWithStatePending(path: string): z.infer<typeof addonZod.getPlaceholderWithStatePending>;
  registerSyncRoot(
    providerName: string,
    providerVersion: string,
    providerId: string,
    callbacks: any,
    logoPath: string,
  ): z.infer<typeof addonZod.registerSyncRoot>;
  unregisterSyncRoot(path: string): z.infer<typeof addonZod.unregisterSyncRoot>;
  updateSyncStatus(path: string, sync: boolean, isDirectory: boolean): z.infer<typeof addonZod.updateSyncStatus>;
  /**
   * TODO: Returns a type in c++ that is not initialized
   */
  updateFileIdentity(itemPath: string, id: string, isDirectory: boolean): any;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
};
