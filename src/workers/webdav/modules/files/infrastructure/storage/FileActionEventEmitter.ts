import EventEmitter from 'events';

type EventMap = {
  [key: string]: (...args: Array<any>) => void;
};

export abstract class FileActionEventEmitter<Events extends EventMap> {
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
  }

  emit(
    eventName: keyof Events & string,
    ...args: Parameters<Events[keyof Events]>
  ): void {
    this.eventEmitter.emit(eventName, ...args);
  }

  on(event: keyof Events & string, handler: Events[keyof Events]) {
    this.eventEmitter.on(event, handler);
  }
}
