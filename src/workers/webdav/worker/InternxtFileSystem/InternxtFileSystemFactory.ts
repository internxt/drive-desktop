import { DependencyContainer } from '../../dependencyInjection/DependencyContainer';
import { InternxtFileSystem } from './InternxtFileSystem';

export class InternxtFileSystemFactory {
  static async build(
    container: DependencyContainer
  ): Promise<InternxtFileSystem> {
    return new InternxtFileSystem(container);
  }
}
