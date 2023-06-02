import { FreeSpacePerEnvironmentCalculator } from 'workers/webdav/modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { UserUsageRepository } from '../../modules/userUsage/domain/UserUsageRepository';

export interface InternxtStorageManagerDepencyContainer {
  userUsageRepository: UserUsageRepository;
  freeUsageCalculator: FreeSpacePerEnvironmentCalculator;
}
