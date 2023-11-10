import configStore from 'main/config';

export class DependencyInjectionLocalRootFolderPath {
  private static path: string;

  static get(): string {
    if (DependencyInjectionLocalRootFolderPath.path) {
      return DependencyInjectionLocalRootFolderPath.path;
    }

    DependencyInjectionLocalRootFolderPath.path = configStore.get('syncRoot');

    return DependencyInjectionLocalRootFolderPath.path;
  }
}
