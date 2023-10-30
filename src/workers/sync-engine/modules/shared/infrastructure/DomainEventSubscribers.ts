import { DependencyContainerFactory } from 'workers/sync-engine/dependency-injection/DependencyContainerFactory';
import { DependencyContainer } from 'workers/sync-engine/dependency-injection/DependencyContainer';
import { DomainEventSubscriber } from '../domain/DomainEventSubscriber';
import { DomainEvent } from '../domain/DomainEvent';

export class DomainEventSubscribers {
  constructor(public items: Array<DomainEventSubscriber<DomainEvent>>) {}

  static from(container: DependencyContainer): DomainEventSubscribers {
    const subscribers = DependencyContainerFactory.subscribers.map(
      (subscriber) => {
        return container[subscriber];
      }
    ) as unknown as Array<DomainEventSubscriber<DomainEvent>>;

    return new DomainEventSubscribers(subscribers);
  }
}
