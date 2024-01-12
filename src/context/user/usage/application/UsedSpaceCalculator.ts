import { UserUsageRepository } from '../domain/UserUsageRepository';
import { BytesInBinaryToInternationalSystem } from './BytesInBinaryToInternationalSystem';

export class UsedSpaceCalculator {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(): Promise<number> {
    const usage = await this.repository.getUsage();

    const used = usage.totalInUse();

    if (process.platform === 'linux')
      return BytesInBinaryToInternationalSystem.run(used);

    if (process.platform === 'darwin')
      return BytesInBinaryToInternationalSystem.run(used);

    return used;
  }
}
