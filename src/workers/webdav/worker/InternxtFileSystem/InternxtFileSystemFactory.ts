import { fileSystemDependencyContainerFactory } from '../../dependencyInjection/FileSystemDependencyContainerFactory';
import { InternxtFileSystem } from './InternxtFileSystem';

export class InternxtFileSystemFactory {
  static async build(): Promise<InternxtFileSystem> {
    const dependecies = await fileSystemDependencyContainerFactory.build();
    return new InternxtFileSystem(dependecies);
  }
}
