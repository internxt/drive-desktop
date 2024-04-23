import { Service } from 'diod';
import { EventBus } from '../../../virtual-drive/shared/domain/EventBus';
import { DomainEvent } from '../../domain/DomainEvent';
import { DomainEventSubscriber } from '../../domain/DomainEventSubscriber';

@Service()
export class SubscribeDomainEventsHandlerToTheirEvents {
  constructor(private readonly eventBus: EventBus) {}

  run(subscribers: Array<DomainEventSubscriber<DomainEvent>>): void {
    this.eventBus.addSubscribers(subscribers);
  }
}
