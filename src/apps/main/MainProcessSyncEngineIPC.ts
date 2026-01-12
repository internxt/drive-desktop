import { ipcMain } from 'electron';
import { TypedIPC } from '../shared/IPC/TypedIPC';
import { BackgroundProcessVirtualDriveEvents } from '../shared/IPC/events/virtualDrive/BackgroundProcessVirtualDriveEvents';

export type MainProcessSyncEngineIPC = TypedIPC<Record<string, never>, BackgroundProcessVirtualDriveEvents>;

export const MainProcessSyncEngineIPC = ipcMain as unknown as MainProcessSyncEngineIPC;
