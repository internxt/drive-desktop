import { ContainerBuilder } from 'diod';
import { registerContentsServices } from './registerContentsServices';
import { registerFilesServices } from './registerFilesServices';
import { registerFolderServices } from './registerFolderServices';
import { registerSharedServices } from './registerSharedServices';
import { registerTreeServices } from './registerTreeServices';

export class VirtualDriveDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    registerTreeServices(builder);

    await registerSharedServices(builder);

    await registerFolderServices(builder);

    registerContentsServices(builder);

    await registerFilesServices(builder);
  }
}
