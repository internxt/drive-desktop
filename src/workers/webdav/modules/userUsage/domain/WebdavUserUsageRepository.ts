import { WebdavUserUsage } from './WebdavUserUsage';

export interface WebdavUserUsageRepository {
  getUsage(): Promise<WebdavUserUsage>;
  save(usage: WebdavUserUsage): Promise<void>;
}
