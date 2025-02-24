import { getConfig } from '../../config';

export class DependencyInjectionLocalRootFolderPath {
  private static path: string;

  static get(): string {
    if (DependencyInjectionLocalRootFolderPath.path) {
      return DependencyInjectionLocalRootFolderPath.path;
    }

    DependencyInjectionLocalRootFolderPath.path = getConfig().rootPath;

    return DependencyInjectionLocalRootFolderPath.path;
  }
}
