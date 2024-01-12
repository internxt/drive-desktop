import { FuseDependencyContainer } from './FuseDependencyContainer';
import { FuseDomainEventSubscribers } from './FuseDomainEventSubscribers';
import { DependencyInjectionEventBus } from './common/eventBus';
import { OfflineDriveDependencyContainerFactory } from './offline/OfflineDriveDependencyContainerFactory';
import { UserContainerFactory } from './user/UserContainerFactory';
import { VirtualDriveDependencyContainerFactory } from './virtual-drive/VirtualDriveDependencyContainerFactory';

type FuseDependencyContainerFactorySubscribers = Array<
  | keyof FuseDependencyContainer['offlineDriveContainer']
  | keyof FuseDependencyContainer['virtualDriveContainer']
  | keyof FuseDependencyContainer['userContainer']
>;

export class FuseDependencyContainerFactory {
  private static _container: FuseDependencyContainer | undefined;

  static readonly subscribers: FuseDependencyContainerFactorySubscribers = [
    ...VirtualDriveDependencyContainerFactory.subscribers,
    ...OfflineDriveDependencyContainerFactory.subscribers,
    ...UserContainerFactory.subscribers,
  ];

  eventSubscribers(
    key: keyof FuseDependencyContainer
  ): FuseDependencyContainer[keyof FuseDependencyContainer] | undefined {
    if (!FuseDependencyContainerFactory._container) return undefined;

    return FuseDependencyContainerFactory._container[key];
  }

  async build(): Promise<FuseDependencyContainer> {
    if (FuseDependencyContainerFactory._container !== undefined) {
      return FuseDependencyContainerFactory._container;
    }

    const { bus } = DependencyInjectionEventBus;

    const virtualDriveContainerFactory =
      new VirtualDriveDependencyContainerFactory();
    const virtualDriveContainer = await virtualDriveContainerFactory.build();

    const offlineDriveContainerFactory =
      new OfflineDriveDependencyContainerFactory();
    const offlineDriveContainer = await offlineDriveContainerFactory.build();

    const userContainerFactory = new UserContainerFactory();
    const userContainer = await userContainerFactory.build();

    const container = {
      offlineDriveContainer,
      virtualDriveContainer,
      userContainer,
    };

    bus.addSubscribers(FuseDomainEventSubscribers.from(container));
    FuseDependencyContainerFactory._container = container;

    return container;
  }
}
