import { Container } from 'diod';
import { DomainEvent } from '../../../context/shared/domain/DomainEvent';
import { DomainEventSubscriber } from '../../../context/shared/domain/DomainEventSubscriber';
import { SubscribeDomainEventsHandlerToTheirEvents } from '../../../context/shared/infrastructure/domain-events/SubscribeDomainEventsHandlerToTheirEvents';
import { mainProcessSharedInfraBuilder } from '../../shared/dependency-injection/main/mainProcessSharedInfraContainer';
import { OfflineDependencyContainerFactory } from './offline-drive/OfflineDependencyContainerFactory';
import { SharedDependencyContainerFactory } from './shared/SharedDependecyContainerFactory';
import { VirtualDriveDependencyContainerFactory } from './virtual-drive/VirtualDriveDependencyContainerFactory';

export class DriveDependencyContainerFactory {
  private static async buildContexts(): Promise<Container> {
    const builder = await mainProcessSharedInfraBuilder();

    SharedDependencyContainerFactory.build(builder);

    await VirtualDriveDependencyContainerFactory.build(builder);

    await OfflineDependencyContainerFactory.build(builder);

    return builder.build();
  }

  private static async addEventSubscribers(container: Container): Promise<void> {
    const subscribers = container
      .findTaggedServiceIdentifiers<DomainEventSubscriber<DomainEvent>>('event-handler')
      .map((identifier) => container.get(identifier));

    const subscribe = container.get(SubscribeDomainEventsHandlerToTheirEvents);
    subscribe.run(subscribers);
  }

  static async build(): Promise<Container> {
    const container = await DriveDependencyContainerFactory.buildContexts();

    await DriveDependencyContainerFactory.addEventSubscribers(container);

    return container;
  }
}
