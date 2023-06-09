import { DependencyContainer } from '../../dependencyInjection/DependencyContainer';
import { InternxtStorageManager } from './InternxtStorageManager';

export class InternxtStorageManagerFactory {
  static async build(
    container: DependencyContainer
  ): Promise<InternxtStorageManager> {
    return new InternxtStorageManager(container);
  }
}
