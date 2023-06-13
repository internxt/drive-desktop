import { ipcRenderer } from 'electron';
import EventEmitter from 'events';
import { WebdavDomainEvent } from '../domain/WebdavDomainEvent';
import { WebdavServerEventBus } from '../domain/WebdavServerEventBus';
import { DomainEventSubscribers } from './DomainEventSubscribers';

// Emits domain events from the webdav server to itself
// and to the main process
export class DuplexEventBus
  extends EventEmitter
  implements WebdavServerEventBus
{
  async publish(events: Array<WebdavDomainEvent>): Promise<void> {
    events.forEach((event) => {
      ipcRenderer.send(event.eventName, event.toPrimitives());
      this.emit(event.eventName, event);
    });
  }

  addSubscribers(subscribers: DomainEventSubscribers): void {
    subscribers.items.forEach((subscriber) => {
      subscriber.subscribedTo().forEach((event) => {
        this.on(`webdav.${event.EVENT_NAME}`, subscriber.on.bind(subscriber));
      });
    });
  }
}
