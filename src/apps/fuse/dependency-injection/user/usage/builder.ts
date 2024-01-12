import { BytesInBinaryToInternationalSystem } from '../../../../../context/user/usage/application/BytesInBinaryToInternationalSystem';
import { DecrementDriveUsageOnFileDeleted } from '../../../../../context/user/usage/application/DecrementDriveUsageOnFileDeleted';
import { FreeSpacePerEnvironmentCalculator } from '../../../../../context/user/usage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../../../../../context/user/usage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../../../../../context/user/usage/application/UsedSpaceCalculator';
import { UserUsageDecrementor } from '../../../../../context/user/usage/application/UserUsageDecrementor';
import { UserUsageIncrementor } from '../../../../../context/user/usage/application/UserUsageIncrementor';
import { CachedHttpUserUsageRepository } from '../../../../../context/user/usage/infrastrucutre/CachedHttpUserUsageRepository';
import { Photos } from '../../common/Photos';
import { DependencyInjectionHttpClientsProvider } from '../../common/clients';
import { UsageContainer } from './UsageContainer';

export async function buildUsageContainer(): Promise<UsageContainer> {
  const clients = DependencyInjectionHttpClientsProvider.get();
  const { photos } = Photos;

  const repository = new CachedHttpUserUsageRepository(
    clients.newDrive,
    photos
  );

  const bytesInBinaryToInternationalSystem =
    new BytesInBinaryToInternationalSystem();

  const freeSpacePerEnvironmentCalculator =
    new FreeSpacePerEnvironmentCalculator(repository);
  const usedSpaceCalculator = new UsedSpaceCalculator(repository);
  const userUsageDecrementor = new UserUsageDecrementor(repository);
  const userUsageIncrementor = new UserUsageIncrementor(repository);

  // event handlers
  const incrementDriveUsageOnFileCreated = new IncrementDriveUsageOnFileCreated(
    userUsageIncrementor
  );
  const decrementDriveUsageOnFileDeleted = new DecrementDriveUsageOnFileDeleted(
    userUsageDecrementor
  );

  const container: UsageContainer = {
    bytesInBinaryToInternationalSystem,
    freeSpacePerEnvironmentCalculator,
    usedSpaceCalculator,
    userUsageDecrementor,
    userUsageIncrementor,
    // event handlers
    incrementDriveUsageOnFileCreated,
    decrementDriveUsageOnFileDeleted,
  };

  return container;
}
