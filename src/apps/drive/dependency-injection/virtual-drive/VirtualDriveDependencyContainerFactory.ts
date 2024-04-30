import { ContainerBuilder } from 'diod';
import { registerFilesServices } from './registerFilesServices';
import { registerFolderServices } from './registerFolderServices';
import { registerVirtualDriveSharedServices } from './registerVirtualDriveSharedServices';
import { registerTreeServices } from './registerTreeServices';

export class VirtualDriveDependencyContainerFactory {
  static async build(builder: ContainerBuilder): Promise<void> {
    registerTreeServices(builder);

    await registerVirtualDriveSharedServices(builder);

    await registerFolderServices(builder);

    await registerFilesServices(builder);
  }
}
