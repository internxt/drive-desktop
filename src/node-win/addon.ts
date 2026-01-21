import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { addon as rawAddon } from '@packages/addon/dist';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Brand } from '@internxt/drive-desktop-core/build/backend/core/utils/brand.types';
import { PinState } from './types/placeholder.type';

export type Win32Path = Brand<string, 'Win32Path'>;

export type CallbackDownload = (buffer: Buffer, offset: number) => void;
export type FetchDataFn = (connectionKey: bigint, path: Win32Path, callback: CallbackDownload) => Promise<void>;
export type CancelFetchDataFn = (connectionKey: bigint, path: Win32Path) => void;

export namespace Watcher {
  export type Event = { event: 'create' | 'update' | 'delete'; path: Win32Path } | { event: 'error'; path: string };
  export type OnEvent = (event: Event) => void;
  export type Subscription = {
    unsubscribe: () => void;
  };
}

type TAddon = {
  createFilePlaceholder(
    path: Win32Path,
    placeholderId: FilePlaceholderId,
    fileSize: number,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<void>;
  connectSyncRoot(path: Win32Path, fetchData: FetchDataFn, cancelFetchData: CancelFetchDataFn): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(path: Win32Path, placeholderId: FilePlaceholderId | FolderPlaceholderId): Promise<void>;
  createFolderPlaceholder(path: Win32Path, placeholderId: FolderPlaceholderId, creationTime: number, lastWriteTime: number): Promise<void>;
  dehydrateFile(path: Win32Path): Promise<void>;
  disconnectSyncRoot(connectionKey: bigint): Promise<void>;
  getPlaceholderState(path: Win32Path): Promise<z.infer<typeof addonZod.getPlaceholderState>>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
  hydrateFile(path: Win32Path): Promise<void>;
  registerSyncRoot(rootPath: Win32Path, providerName: string, providerVersion: string, providerId: string, logoPath: string): Promise<void>;
  setPinState(path: Win32Path, pinState: PinState): Promise<void>;
  unregisterSyncRoot(providerId: string): Promise<void>;
  unwatchPath(handle: object): void;
  updatePlaceholder(path: Win32Path, placeholderId: FilePlaceholderId, size: number): Promise<void>;
  updateSyncStatus(path: Win32Path): Promise<void>;
  watchPath(rootPath: Win32Path, onEvent: Watcher.OnEvent): z.infer<typeof addonZod.watchPath>;
};

export const addon: TAddon = rawAddon;
