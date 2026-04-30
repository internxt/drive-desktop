import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Brand } from '@internxt/drive-desktop-core/build/backend/core/utils/brand.types';
import { addon as rawAddon } from '@packages/addon/dist';
import { z } from 'zod';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { addonZod } from './addon/addon-zod';
import { PinState } from './types/placeholder.type';

export type Win32Path = Brand<string, 'Win32Path'>;
export type Win32DevicePath = Brand<string, 'Win32DevicePath'>;

export type CallbackDownload = (buffer: Buffer, offset: number) => void;
export type FetchDataCallback = (connectionKey: bigint, path: Win32Path, callback: CallbackDownload) => void;

export namespace Watcher {
  export type SuccessEvent = {
    action: 'create' | 'update' | 'delete' | 'rename_old' | 'rename_new';
    type: 'file' | 'folder';
    path: AbsolutePath;
    size: number;
    internalId: number;
    ctimeMs: number;
    mtimeMs: number;
  };
  export type ErrorEvent = { action: 'error'; type: 'error'; path: string };
  export type Event = SuccessEvent | ErrorEvent;
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
  connectSyncRoot(path: Win32Path, fetchDataCallback: FetchDataCallback): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(path: Win32DevicePath, placeholderId: FilePlaceholderId | FolderPlaceholderId): Promise<void>;
  createFolderPlaceholder(
    path: Win32DevicePath,
    placeholderId: FolderPlaceholderId,
    creationTime: number,
    lastWriteTime: number,
  ): Promise<void>;
  dehydrateFile(path: Win32Path): Promise<void>;
  disconnectSyncRoot(connectionKey: bigint): Promise<void>;
  getFirstNonPlaceholder(path: Win32DevicePath): Promise<z.infer<typeof addonZod.getFirstNonPlaceholder>>;
  getPlaceholderState(path: Win32DevicePath): Promise<z.infer<typeof addonZod.getPlaceholderState>>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
  getSyncRootFromPath(rootPath: Win32Path): Promise<z.infer<typeof addonZod.getSyncRootFromPath>>;
  hydrateFile(path: Win32Path): Promise<void>;
  registerSyncRoot(rootPath: Win32Path, providerName: string, providerVersion: string, id: string, logoPath: string): Promise<void>;
  setPinState(path: Win32DevicePath, pinState: PinState): Promise<void>;
  unregisterSyncRoot(id: string): Promise<void>;
  unwatchPath(handle: object): void;
  updatePlaceholder(path: Win32DevicePath, placeholderId: FilePlaceholderId, size: number): Promise<void>;
  updateSyncStatus(path: Win32DevicePath): Promise<void>;
  watchPath(rootPath: Win32Path, onEvent: Watcher.OnEvent): z.infer<typeof addonZod.watchPath>;
};

export const addon: TAddon = rawAddon;
