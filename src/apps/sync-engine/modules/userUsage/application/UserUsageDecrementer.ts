import { UserUsageRepository } from '../domain/UserUsageRepository';

export class UserUsageDecrementer {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(weight: number) {
    const usage = await this.repository.getUsage();

    if (usage.drive >= weight) {
      usage.incrementDriveUsage(-weight);

      await this.repository.save(usage);
    }
  }
}
