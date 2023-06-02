import { UserUsageRepository } from '../domain/UserUsageRepository';

export class FreeSpacePerEnvironmentCalculator {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(): Promise<number> {
    const usage = await this.repository.getUsage();

    if (usage.isInfinite()) {
      return -1;
    }

    return usage.free();
  }
}
