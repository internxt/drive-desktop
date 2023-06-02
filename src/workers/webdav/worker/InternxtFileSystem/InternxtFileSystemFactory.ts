import { buildContainer } from './dependencyInjection/build';
import { InternxtFileSystem } from './InternxtFileSystem';

export class InternxtFileSystemFactory {
  static async build(): Promise<InternxtFileSystem> {
    const dependecies = await buildContainer();
    return new InternxtFileSystem(dependecies);
  }
}
