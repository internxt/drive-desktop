import { EventEmitter } from 'events';

class EventBus extends EventEmitter {}

interface Events {
  APP_IS_READY: () => void;

  // Fired when the user either
  // logs in or is already logged
  // in on app start
  USER_LOGGED_IN: () => void;

  SYNC_ROOT_CHANGED: (newPath: string) => void;

  USER_LOGGED_OUT: () => void;

  WIDGET_IS_READY: () => void;
}

declare interface EventBus {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(
    event: U,
    ...args: Parameters<Events[U]>
  ): boolean;
}

const eventBus = new EventBus();

export default eventBus;
