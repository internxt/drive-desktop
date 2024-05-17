import configStore from '../../../main/config';

export class DependencyInjectionLogEnginePath {
  private static path: string;

  static get(): string {
    if (DependencyInjectionLogEnginePath.path) {
      return DependencyInjectionLogEnginePath.path;
    }

    DependencyInjectionLogEnginePath.path = configStore.get('logEnginePath');

    return DependencyInjectionLogEnginePath.path;
  }
}

export class DependencyInjectionLogWatcherPath {
  private static path: string;

  static get(): string {
    if (DependencyInjectionLogWatcherPath.path) {
      return DependencyInjectionLogWatcherPath.path;
    }

    DependencyInjectionLogWatcherPath.path = configStore.get('logWatcherPath');

    return DependencyInjectionLogWatcherPath.path;
  }
}
