import { WebdavUserUsageRepository } from '../domain/WebdavUserUsageRepository';
import { BytesInBinaryToInternacionalSystem } from './BytesInBinaryToInternacionalSystem';

export class UsedSpaceCalculator {
  constructor(private readonly repository: WebdavUserUsageRepository) {}

  async run(): Promise<number> {
    const usage = await this.repository.getUsage();

    const used = usage.totalInUse();

    if (process.platform === 'linux')
      return BytesInBinaryToInternacionalSystem.run(used);

    if (process.platform === 'darwin')
      return BytesInBinaryToInternacionalSystem.run(used);

    return used;
  }
}
