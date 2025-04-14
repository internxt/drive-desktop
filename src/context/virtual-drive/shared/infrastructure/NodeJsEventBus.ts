import EventEmitter from 'events';
import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '@/context/shared/domain/DomainEventSubscriber';

export class NodeJsEventBus extends EventEmitter {
  publish(events: Array<DomainEvent>) {
    events.forEach((event) => {
      this.emit(event.eventName, event);
    });
  }

  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    subscribers.forEach((subscriber) => {
      subscriber.subscribedTo().forEach((event) => {
        this.on(event.EVENT_NAME, subscriber.on.bind(subscriber));
      });
    });
  }
}
