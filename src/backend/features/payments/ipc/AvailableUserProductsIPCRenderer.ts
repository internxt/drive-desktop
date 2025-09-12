import { ipcRenderer } from 'electron';

import { MainProcessAvailableUserProductsMessages } from './messages/MainProcessAvailableUserProductsMessages';
import { RendererProcessAvailableUserProductsMessages } from './messages/RendererProcessAvailableUserProductsMessages';
import { TypedIPC } from '../../../../apps/shared/IPC/TypedIPC';

/**
 * Typed IPC for the user's products availability communication in the renderer process
 */
export type AvailableUserProductsIPCRenderer = TypedIPC<
  MainProcessAvailableUserProductsMessages,
  RendererProcessAvailableUserProductsMessages
>;


export const AvailableUserProductsIPCRenderer = ipcRenderer as unknown as AvailableUserProductsIPCRenderer;

