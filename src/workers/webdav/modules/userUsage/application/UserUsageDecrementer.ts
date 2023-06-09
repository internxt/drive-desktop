import { WebdavUserUsageRepository } from '../domain/WebdavUserUsageRepository';

export class UserUsageDecrementer {
  constructor(private readonly repository: WebdavUserUsageRepository) {}

  async run(weight: number) {
    const usage = await this.repository.getUsage();

    if (usage.drive >= weight) {
      usage.incrementDriveUsage(-weight);

      await this.repository.save(usage);
    }
  }
}
