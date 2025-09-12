import { ipcMain } from 'electron';
import { TypedIPC } from '../../../../apps/shared/IPC/TypedIPC';
import { MainProcessAvailableUserProductsMessages } from './messages/MainProcessAvailableUserProductsMessages';
import { RendererProcessAvailableUserProductsMessages } from './messages/RendererProcessAvailableUserProductsMessages';

/**
 * Typed IPC for the user's products availability communication in the main process
 */
export type AvailableUserProductsIPCMain = TypedIPC<
  RendererProcessAvailableUserProductsMessages,
  MainProcessAvailableUserProductsMessages
>;
export const AvailableUserProductsIPCMain =
  ipcMain as unknown as AvailableUserProductsIPCMain;
