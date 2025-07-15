import { EventEmitter } from 'events';
import { ProgressData } from './antivirus/ManualSystemScan';
import { BroadcastToWindows } from './windows/broadcast-to-windows';

class EventBus extends EventEmitter {}

interface Events {
  APP_IS_READY: () => void;

  // Fired when the user either
  // logs in or is already logged
  // in on app start and the tokens are correct
  USER_LOGGED_IN: () => void;

  SYNC_ROOT_CHANGED: (newPath: string) => void;

  USER_LOGGED_OUT: () => void;

  // Fired when a response to any internxt service
  // has status 401 UNAUTHORIZED
  USER_WAS_UNAUTHORIZED: () => void;

  WIDGET_IS_READY: () => void;

  // Get the scan progress
  ANTIVIRUS_SCAN_PROGRESS: (progress: ProgressData & { done?: boolean }) => void;
  BROADCAST_TO_WINDOWS: (_: BroadcastToWindows) => void;
}

declare interface EventBus {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

const eventBus = new EventBus();

eventBus.setMaxListeners(20);

export default eventBus;
