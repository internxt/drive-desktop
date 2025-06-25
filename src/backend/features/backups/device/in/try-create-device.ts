import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@/apps/shared/logger/logger';

export async function tryCreateDevice({ deviceName }: { deviceName: string }) {
  const { data, error } = await driveServerWipModule.backup.createDevice({ deviceName });
  if (data) return { data };

  if (error?.code === 'ALREADY_EXISTS') {
    return {
      error: logger.info({
        tag: 'BACKUPS',
        msg: 'Device name already exists',
        deviceName,
      }),
    };
  }

  return { error: logger.error({ tag: 'BACKUPS', msg: 'Error creating device', error }) };
}
