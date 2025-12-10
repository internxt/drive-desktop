import { z } from 'zod';

import { addonZod } from './addon/addon-zod';
import { Callbacks } from './types/callbacks.type';
import { addon as rawAddon } from '@packages/addon/dist';
import { FilePlaceholderId } from '@/context/virtual-drive/files/domain/PlaceholderId';
import { FolderPlaceholderId } from '@/context/virtual-drive/folders/domain/FolderPlaceholderId';
import { Brand } from '@internxt/drive-desktop-core/build/backend/core/utils/brand.types';
import { PinState } from './types/placeholder.type';

export type Win32Path = Brand<string, 'Win32Path'>;

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
  connectSyncRoot(path: Win32Path, callbacks: Callbacks): z.infer<typeof addonZod.connectSyncRoot>;
  convertToPlaceholder(
    path: Win32Path,
    placeholderId: FilePlaceholderId | FolderPlaceholderId,
  ): Promise<z.infer<typeof addonZod.convertToPlaceholder>>;
  disconnectSyncRoot(path: Win32Path): Promise<z.infer<typeof addonZod.disconnectSyncRoot>>;
  getPlaceholderState(path: Win32Path): Promise<z.infer<typeof addonZod.getPlaceholderState>>;
  registerSyncRoot(rootPath: Win32Path, providerName: string, providerVersion: string, providerId: string, logoPath: string): Promise<void>;
  unregisterSyncRoot(providerId: string): Promise<void>;
  updateSyncStatus(path: Win32Path): Promise<z.infer<typeof addonZod.updateSyncStatus>>;
  getRegisteredSyncRoots(): z.infer<typeof addonZod.getRegisteredSyncRoots>;
};

export const addon: TAddon = rawAddon;
