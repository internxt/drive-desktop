import { UserUsageRepository } from '../domain/UserUsageRepository';

export class UserUsageIncrementor {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(weight: number) {
    const usage = await this.repository.getUsage();

    if (usage.free() >= weight) {
      usage.incrementDriveUsage(weight);

      await this.repository.save(usage);
    }
  }
}
