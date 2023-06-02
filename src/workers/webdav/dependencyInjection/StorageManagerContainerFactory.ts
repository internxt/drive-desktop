import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { ipcRenderer } from 'electron';
import { FreeSpacePerEnvironmentCalculator } from '../modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { HttpUserUsageRepository } from '../modules/userUsage/infrastrucutre/HttpUserUsageRepository';
import { InternxtStorageManagerDepencyContainer } from '../worker/InternxtStorageManager/InternxtStorageManagerDepencyContainer';
import { DependencyContainerFactory } from './DependencyContainerFactory';
import { sharedDepenciesContainerFactory } from './SharedDepenciesContainerFactory';

class StorageManagerContainerFactory extends DependencyContainerFactory<InternxtStorageManagerDepencyContainer> {
  async create(): Promise<InternxtStorageManagerDepencyContainer> {
    const shared = await sharedDepenciesContainerFactory.build();

    const token = await ipcRenderer.invoke('get-new-token');

    const photosSubmodule = new PhotosSubmodule({
      baseUrl: process.env.PHOTOS_URL,
      accessToken: token,
    });

    const userUsageRepository = new HttpUserUsageRepository(
      shared.drive,
      photosSubmodule
    );

    return {
      userUsageRepository,
      freeUsageCalculator: new FreeSpacePerEnvironmentCalculator(
        userUsageRepository
      ),
    };
  }
}

export const storageManagerContainerFactory =
  new StorageManagerContainerFactory();
