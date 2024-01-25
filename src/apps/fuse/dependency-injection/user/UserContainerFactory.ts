import { UserDependencyContainer } from './UserDependencyContainer';
import { buildUsageContainer } from './usage/builder';

export class UserContainerFactory {
  private static _container: UserDependencyContainer | undefined;

  static readonly subscribers: Array<keyof UserDependencyContainer> = [
    'decrementDriveUsageOnFileDeleted',
    'incrementDriveUsageOnFileCreated',
  ];

  eventSubscribers(
    key: keyof UserDependencyContainer
  ): UserDependencyContainer[keyof UserDependencyContainer] | undefined {
    if (!UserContainerFactory._container) return undefined;

    return UserContainerFactory._container[key];
  }

  async build(): Promise<UserDependencyContainer> {
    if (UserContainerFactory._container !== undefined) {
      return UserContainerFactory._container;
    }

    const usage = await buildUsageContainer();

    const container: UserDependencyContainer = {
      ...usage,
    };

    return container;
  }
}
