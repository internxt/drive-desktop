import { FreeSpacePerEnvironmentCalculator } from 'workers/webdav/modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { UsedSpaceCalculator } from 'workers/webdav/modules/userUsage/application/UsedSpaceCalculator';
import { UserUsageRepository } from '../../modules/userUsage/domain/UserUsageRepository';

export interface InternxtStorageManagerDepencyContainer {
  userUsageRepository: UserUsageRepository;
  freeUsageCalculator: FreeSpacePerEnvironmentCalculator;
  usedSpaceCalculator: UsedSpaceCalculator;
}
