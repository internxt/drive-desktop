import { ipcRenderer } from 'electron';
import { TypedIPC } from '../../shared/IPC/TypedIPC';
import { MainProcessAntivirusMessages } from './messages/MainProcessMessages';
import { BackgroundProcessAntivirusMessages } from './messages/BackgroundProcessMessages';

/**
 * Typed IPC for antivirus-related communication in the renderer process
 */
export type AntivirusIPCRenderer = TypedIPC<
  MainProcessAntivirusMessages,
  BackgroundProcessAntivirusMessages
>;

/**
 * Singleton instance of the typed IPC for antivirus in the renderer process
 */
export const AntivirusIPCRenderer =
  ipcRenderer as unknown as AntivirusIPCRenderer;
