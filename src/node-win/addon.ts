import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { addon as rawAddon } from '@packages/addon/dist';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Brand } from '@internxt/drive-desktop-core/build/backend/core/utils/brand.types';
import { PinState } from './types/placeholder.type';

export type Win32Path = Brand<string, 'Win32Path'>;
export type Win32DevicePath = Brand<string, 'Win32DevicePath'>;

export type CallbackDownload = (buffer: Buffer, offset: number) => void;
export type FetchDataFn = (connectionKey: bigint, path: Win32Path, callback: CallbackDownload) => Promise<void>;

export namespace Watcher {
  export type Event =
    | { action: 'create' | 'update'; type: 'file' | 'folder' | 'error'; path: Win32Path }
    | { action: 'delete'; type: 'unknown'; path: Win32Path }
    | { action: 'error'; type: 'error'; path: string };
  export type OnEvent = (event: Event) => void;
  export type Subscription = {
    unsubscribe: () => void;
  };
}

type TAddon = {
  createFilePlaceholder(
    path: Win32DevicePath,
    placeholderId: FilePlaceholderId,
    fileSize: number,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<void>;
  connectSyncRoot(path: Win32Path, fetchData: FetchDataFn): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(path: Win32DevicePath, placeholderId: FilePlaceholderId | FolderPlaceholderId): Promise<void>;
  createFolderPlaceholder(
    path: Win32DevicePath,
    placeholderId: FolderPlaceholderId,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<void>;
  dehydrateFile(path: Win32Path): Promise<void>;
  disconnectSyncRoot(connectionKey: bigint): Promise<void>;
  getPlaceholderState(path: Win32DevicePath): Promise<z.infer<typeof addonZod.getPlaceholderState>>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
  hydrateFile(path: Win32Path): Promise<void>;
  registerSyncRoot(rootPath: Win32Path, providerName: string, providerVersion: string, providerId: string, logoPath: string): Promise<void>;
  setPinState(path: Win32DevicePath, pinState: PinState): Promise<void>;
  unregisterSyncRoot(providerId: string): Promise<void>;
  unwatchPath(handle: object): void;
  updatePlaceholder(path: Win32DevicePath, placeholderId: FilePlaceholderId, size: number): Promise<void>;
  updateSyncStatus(path: Win32DevicePath): Promise<void>;
  watchPath(rootPath: Win32Path, onEvent: Watcher.OnEvent): z.infer<typeof addonZod.watchPath>;
};

export const addon: TAddon = rawAddon;
