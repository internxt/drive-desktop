import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';

export abstract class EventBus {
  abstract publish(events: Array<DomainEvent>): Promise<void>;
  abstract addSubscribers(
    subscribers: Array<DomainEventSubscriber<DomainEvent>>
  ): void;
}
