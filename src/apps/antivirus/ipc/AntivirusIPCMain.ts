import { ipcMain } from 'electron';
import { TypedIPC } from '../../shared/IPC/TypedIPC';
import { BackgroundProcessAntivirusMessages } from './messages/BackgroundProcessMessages';
import { MainProcessAntivirusMessages } from './messages/MainProcessMessages';

/**
 * Typed IPC for antivirus-related communication in the main process
 */
export type AntivirusIPCMain = TypedIPC<BackgroundProcessAntivirusMessages, MainProcessAntivirusMessages>;

/**
 * Singleton instance of the typed IPC for antivirus in the main process
 */
export const AntivirusIPCMain = ipcMain as unknown as AntivirusIPCMain;
