import { DomainEventSubscriber } from '../../../context/shared/domain/DomainEventSubscriber';
import { DomainEvent } from '../../../context/shared/domain/DomainEvent';
import { SyncEngineDependencyContainerFactory } from './SyncEngineDependencyContainerFactory';
import { SyncEngineDependencyContainer } from './SyncEngineDependencyContainer';

export class SyncEngineDomainEventSubscribers {
  constructor(public items: Array<DomainEventSubscriber<DomainEvent>>) {}

  static from(
    container: SyncEngineDependencyContainer
  ): SyncEngineDomainEventSubscribers {
    const subscribers = SyncEngineDependencyContainerFactory.subscribers.map(
      (subscriber) => {
        return container[subscriber];
      }
    ) as unknown as Array<DomainEventSubscriber<DomainEvent>>;

    return new SyncEngineDomainEventSubscribers(subscribers);
  }
}
