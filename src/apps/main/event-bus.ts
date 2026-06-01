import { EventEmitter } from 'events';
import { ProgressData } from './antivirus/types';
import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';

interface Events {
  APP_IS_READY: () => void;

  // Fired when the user either
  // logs in or is already logged
  // in on app start and the tokens are correct
  USER_LOGGED_IN: () => void;

  SYNC_ROOT_CHANGED: (newPath: string) => void;

  USER_LOGGED_OUT: () => void;

  WIDGET_IS_READY: () => void;

  // Fired when we receive some changes
  // via websocket
  RECEIVED_REMOTE_CHANGES: () => void;

  // Used when we have at least one full remote-local sync so we can display content
  INITIAL_SYNC_READY: () => void;

  // Used when the local DB has the most recent changes of remote
  REMOTE_CHANGES_SYNCHED: () => void;

  APP_DATA_SOURCE_INITIALIZED: () => void;

  ANTIVIRUS_SCAN_PROGRESS: (progress: ProgressData & { done?: boolean }) => void;

  GET_USER_AVAILABLE_PRODUCTS: () => void;

  USER_AVAILABLE_PRODUCTS_UPDATED: (products: UserAvailableProducts) => void;
}

class EventBus extends EventEmitter {
  on<U extends keyof Events>(event: U, listener: Events[U]): this {
    return super.on(event, listener);
  }

  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean {
    return super.emit(event, ...args);
  }
}

const eventBus = new EventBus();

eventBus.setMaxListeners(20);

export default eventBus;
