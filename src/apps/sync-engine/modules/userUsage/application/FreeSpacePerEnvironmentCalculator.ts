import { UserUsageRepository } from '../domain/UserUsageRepository';
import { BytesInBinaryToInternacionalSystem } from './BytesInBinaryToInternacionalSystem';

export class FreeSpacePerEnvironmentCalculator {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(): Promise<number> {
    const usage = await this.repository.getUsage();

    if (usage.isInfinite()) {
      return -1;
    }

    const freeSpace = usage.free();

    if (process.platform === 'linux')
      return BytesInBinaryToInternacionalSystem.run(freeSpace);

    if (process.platform === 'darwin')
      return BytesInBinaryToInternacionalSystem.run(freeSpace);

    return freeSpace;
  }
}
