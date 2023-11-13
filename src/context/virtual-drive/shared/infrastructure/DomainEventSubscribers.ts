import { DomainEventSubscriber } from '../../../shared/domain/DomainEventSubscriber';
import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { DependencyContainer } from '../../../../apps/sync-engine/dependency-injection/DependencyContainer';
import { DependencyContainerFactory } from '../../../../apps/sync-engine/dependency-injection/DependencyContainerFactory';

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
