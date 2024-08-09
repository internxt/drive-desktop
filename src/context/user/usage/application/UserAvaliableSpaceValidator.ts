import { Service } from 'diod';
import { UserUsageRepository } from '../domain/UserUsageRepository';

@Service()
export class UserAvaliableSpaceValidator {
  constructor(private readonly repository: UserUsageRepository) {}

  async run(desiredSpaceToUse: number): Promise<boolean> {
    const usage = await this.repository.getUsage();

    return desiredSpaceToUse < usage.free();
  }
}
