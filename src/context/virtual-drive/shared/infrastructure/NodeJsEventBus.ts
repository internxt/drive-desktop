import EventEmitter from 'events';
import { SynchronizeOfflineModificationsOnFolderCreated } from '../../folders/application/SynchronizeOfflineModificationsOnFolderCreated';
import { AllowedEvents } from './AllowedEvents';

export class NodeJsEventBus extends EventEmitter {
  publish(events: Array<AllowedEvents>): void {
    events.forEach((event) => {
      this.emit(event.eventName, event);
    });
  }

  addSubscribers(subscriber: SynchronizeOfflineModificationsOnFolderCreated): void {
    subscriber.subscribedTo().forEach((event) => {
      this.on(event.EVENT_NAME, subscriber.on.bind(subscriber));
    });
  }
}
