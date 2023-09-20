import { UserUsage } from './UserUsage';

export interface UserUsageRepository {
  getUsage(): Promise<UserUsage>;
  save(usage: UserUsage): Promise<void>;
}
