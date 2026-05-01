import { EventEmitter } from 'node:events';

class EventBus extends EventEmitter {}

type Events = {
  USER_LOGGED_OUT: () => void;
};

declare interface EventBus {
  on<U extends keyof Events>(event: U, listener: Events[U]): this;

  emit<U extends keyof Events>(event: U, ...args: Parameters<Events[U]>): boolean;
}

export const eventBus = new EventBus();

eventBus.setMaxListeners(20);

export default eventBus;
