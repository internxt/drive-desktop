import { UserUsageRepository } from '../domain/UserUsageRepository';
import { BytesInBinaryToInternationalSystem } from './BytesInBinaryToInternationalSystem';

export class FreeSpacePerEnvironmentCalculator {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(): Promise<number> {
    const usage = await this.repository.getUsage();

    if (usage.isInfinite()) {
      return -1;
    }

    const freeSpace = usage.free();

    if (process.platform === 'linux')
      return BytesInBinaryToInternationalSystem.run(freeSpace);

    if (process.platform === 'darwin')
      return BytesInBinaryToInternationalSystem.run(freeSpace);

    return freeSpace;
  }
}
