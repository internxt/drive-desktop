import { EmittedEvents } from '@/apps/main/windows/ipc/emitted-events';
import { TypedIPC } from '../../../apps/shared/IPC/TypedIPC';
import { ipcRenderer } from 'electron';
import { ListenedEvents } from '@/apps/main/windows/ipc/listened-events';

export type TSettingsIPCRenderer = TypedIPC<EmittedEvents, ListenedEvents>;
export const SettingsIPCRenderer = ipcRenderer as unknown as TSettingsIPCRenderer;
