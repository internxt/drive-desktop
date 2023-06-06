import { WebdavUserUsageRepository } from '../domain/WebdavUserUsageRepository';
import { BytesInBinaryToInternacionalSystem } from './BytesInBinaryToInternacionalSystem';

export class FreeSpacePerEnvironmentCalculator {
  constructor(private readonly repository: WebdavUserUsageRepository) {}

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
