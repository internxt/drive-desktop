import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { ContainerBuilder } from 'diod';
import { BytesInBinaryToInternationalSystem } from '../../../../context/user/usage/application/BytesInBinaryToInternationalSystem';
import { DecrementDriveUsageOnFileDeleted } from '../../../../context/user/usage/application/DecrementDriveUsageOnFileDeleted';
import { FreeSpacePerEnvironmentCalculator } from '../../../../context/user/usage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../../../../context/user/usage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../../../../context/user/usage/application/UsedSpaceCalculator';
import { UserUsageDecrementor } from '../../../../context/user/usage/application/UserUsageDecrementor';
import { UserUsageIncrementor } from '../../../../context/user/usage/application/UserUsageIncrementor';
import { UserUsageRepository } from '../../../../context/user/usage/domain/UserUsageRepository';
import { CachedHttpUserUsageRepository } from '../../../../context/user/usage/infrastrucutre/CachedHttpUserUsageRepository';
import { AuthorizedClients } from '../../../shared/HttpClient/Clients';

export function registerUsageServices(builder: ContainerBuilder): void {
  // Infra
  builder
    .register(UserUsageRepository)
    .useFactory(
      (c) =>
        new CachedHttpUserUsageRepository(
          //@ts-ignore
          c.get(AuthorizedClients).newDrive,
          c.get(PhotosSubmodule)
        )
    )
    .private();

  // Services
  builder.registerAndUse(BytesInBinaryToInternationalSystem);
  builder.registerAndUse(FreeSpacePerEnvironmentCalculator);
  builder.registerAndUse(UsedSpaceCalculator);
  builder.registerAndUse(UserUsageDecrementor);
  builder.registerAndUse(UserUsageIncrementor);

  // Event Handlers
  builder.registerAndUse(IncrementDriveUsageOnFileCreated);
  builder.registerAndUse(DecrementDriveUsageOnFileDeleted);
}
