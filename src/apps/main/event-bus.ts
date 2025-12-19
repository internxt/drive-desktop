import { EventEmitter } from 'node:events';
import { ProgressData } from './antivirus/ManualSystemScan';
import { BroadcastToWindows } from './windows/broadcast-to-windows';

class EventBus extends EventEmitter {}

type Events = {
  USER_LOGGED_IN: () => void;
  USER_LOGGED_OUT: () => void;
  ANTIVIRUS_SCAN_PROGRESS: (progress: ProgressData & { done?: boolean }) => void;
  BROADCAST_TO_WINDOWS: (_: BroadcastToWindows) => void;
};

declare interface EventBus {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

export const eventBus = new EventBus();

eventBus.setMaxListeners(20);

export default eventBus;
