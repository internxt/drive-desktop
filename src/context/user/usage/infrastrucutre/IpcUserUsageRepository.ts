import { Service } from 'diod';
import { UserUsage } from '../domain/UserUsage';
import { AccountIpcRenderer } from '../../../../apps/shared/IPC/events/account/AccountIpcRenderer';

@Service()
export class IpcUserUsageRepository {
  async getUsage(): Promise<UserUsage> {
    const usage = await AccountIpcRenderer.invoke('account.get-usage');

    return UserUsage.from({
      drive: usage.driveUsage,
      photos: usage.photosUsage,
      limit: usage.limitInBytes,
    });
  }
}
