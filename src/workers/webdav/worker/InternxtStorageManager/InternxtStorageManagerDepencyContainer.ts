import { FreeSpacePerEnvironmentCalculator } from 'workers/webdav/modules/userUsage/application/FreeSpacePerEnvironmentCalculator';
import { UsedSpaceCalculator } from 'workers/webdav/modules/userUsage/application/UsedSpaceCalculator';
import { WebdavUserUsageRepository } from '../../modules/userUsage/domain/WebdavUserUsageRepository';

export interface InternxtStorageManagerDepencyContainer {
  userUsageRepository: WebdavUserUsageRepository;
  freeUsageCalculator: FreeSpacePerEnvironmentCalculator;
  usedSpaceCalculator: UsedSpaceCalculator;
}
