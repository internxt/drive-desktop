import { DomainEvent } from '../../../context/shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../context/shared/domain/DomainEventSubscriber';
import { FuseDependencyContainer } from './FuseDependencyContainer';
import { FuseDependencyContainerFactory } from './FuseDependencyContainerFactory';

export class FuseDomainEventSubscribers {
  constructor(public items: Array<DomainEventSubscriber<DomainEvent>>) {}

  static from(container: FuseDependencyContainer): FuseDomainEventSubscribers {
    const plainContainer = {
      ...container.offlineDriveContainer,
      ...container.virtualDriveContainer,
    };

    const subscribers = FuseDependencyContainerFactory.subscribers.map(
      (subscriber) => {
        return plainContainer[subscriber];
      }
    ) as unknown as Array<DomainEventSubscriber<DomainEvent>>;

    return new FuseDomainEventSubscribers(subscribers);
  }
}
