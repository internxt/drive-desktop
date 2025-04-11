import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DomainEventSubscriber } from '@/context/shared/domain/DomainEventSubscriber';

export interface EventBus {
  publish(events: Array<DomainEvent>): Promise<void>;
  addSubscribers(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void;
}
