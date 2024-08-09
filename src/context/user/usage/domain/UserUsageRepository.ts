import { UserUsage } from './UserUsage';

export abstract class UserUsageRepository {
  abstract getUsage(): Promise<UserUsage>;
}
