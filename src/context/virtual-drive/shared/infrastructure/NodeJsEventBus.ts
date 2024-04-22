import EventEmitter from 'events';
import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { EventBus } from '../domain/EventBus';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';

export class NodeJsEventBus extends EventEmitter implements EventBus {
  async publish(events: Array<DomainEvent>): Promise<void> {
    events.forEach((event) => {
      this.emit(event.eventName, event);
    });
  }

  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    subscribers.forEach((subscriber) => {
      subscriber.subscribedTo().forEach((event) => {
        this.on(`${event.EVENT_NAME}`, subscriber.on.bind(subscriber));
      });
    });
  }

  instance() {
    return this;
  }
}
