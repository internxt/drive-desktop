import { BytesInBinaryToInternationalSystem } from '../../../../../context/user/usage/application/BytesInBinaryToInternationalSystem';
import { DecrementDriveUsageOnFileDeleted } from '../../../../../context/user/usage/application/DecrementDriveUsageOnFileDeleted';
import { FreeSpacePerEnvironmentCalculator } from '../../../../../context/user/usage/application/FreeSpacePerEnvironmentCalculator';
import { IncrementDriveUsageOnFileCreated } from '../../../../../context/user/usage/application/IncrementDriveUsageOnFileCreated';
import { UsedSpaceCalculator } from '../../../../../context/user/usage/application/UsedSpaceCalculator';
import { UserUsageDecrementor } from '../../../../../context/user/usage/application/UserUsageDecrementor';
import { UserUsageIncrementor } from '../../../../../context/user/usage/application/UserUsageIncrementor';

export interface UsageContainer {
  bytesInBinaryToInternationalSystem: BytesInBinaryToInternationalSystem;
  freeSpacePerEnvironmentCalculator: FreeSpacePerEnvironmentCalculator;
  usedSpaceCalculator: UsedSpaceCalculator;
  userUsageDecrementor: UserUsageDecrementor;
  userUsageIncrementor: UserUsageIncrementor;
  // event handlers
  decrementDriveUsageOnFileDeleted: DecrementDriveUsageOnFileDeleted;
  incrementDriveUsageOnFileCreated: IncrementDriveUsageOnFileCreated;
}
