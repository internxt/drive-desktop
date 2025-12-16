import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { addon as rawAddon } from '@packages/addon/dist';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Brand } from '@internxt/drive-desktop-core/build/backend/core/utils/brand.types';
import { PinState } from './types/placeholder.type';

export type Win32Path = Brand<string, 'Win32Path'>;
export type CallbackDownload = (buffer: Buffer, offset: number) => void;
export type FetchDataFn = (connectionKey: bigint, path: Win32Path, callback: CallbackDownload) => void;
export type CancelFetchDataFn = (connectionKey: bigint, path: Win32Path) => void;

type TAddon = {
  createFilePlaceholder(
    path: Win32Path,
    placeholderId: FilePlaceholderId,
    fileSize: number,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<z.infer<typeof addonZod.createFilePlaceholder>>;
  createFolderPlaceholder(
    path: Win32Path,
    placeholderId: FolderPlaceholderId,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<z.infer<typeof addonZod.createFolderPlaceholder>>;
  setPinState(path: Win32Path, pinState: PinState): Promise<void>;
  updatePlaceholder(path: Win32Path, placeholderId: FilePlaceholderId, size: number): Promise<void>;
  hydrateFile(path: Win32Path): Promise<z.infer<typeof addonZod.hydrateFile>>;
  dehydrateFile(path: Win32Path): Promise<z.infer<typeof addonZod.dehydrateFile>>;
  connectSyncRoot(path: Win32Path, fetchData: FetchDataFn, cancelFetchData: CancelFetchDataFn): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(
    path: Win32Path,
    placeholderId: FilePlaceholderId | FolderPlaceholderId,
  ): Promise<z.infer<typeof addonZod.convertToPlaceholder>>;
  disconnectSyncRoot(connectionKey: bigint): Promise<z.infer<typeof addonZod.disconnectSyncRoot>>;
  getPlaceholderState(path: Win32Path): Promise<z.infer<typeof addonZod.getPlaceholderState>>;
  registerSyncRoot(
    rootPath: Win32Path,
    providerName: string,
    providerVersion: string,
    providerId: string,
    logoPath: string,
  ): Promise<z.infer<typeof addonZod.registerSyncRoot>>;
  unregisterSyncRoot(providerId: string): Promise<z.infer<typeof addonZod.unregisterSyncRoot>>;
  updateSyncStatus(path: Win32Path): Promise<z.infer<typeof addonZod.updateSyncStatus>>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
};

export const addon: TAddon = rawAddon;
