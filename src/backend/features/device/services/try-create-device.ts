import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';
import { logger } from '@internxt/drive-desktop-core/build/backend';

type Props = {
  key: string;
  name: string;
};

export async function tryCreateDevice({ key, name }: Props) {
  const { data, error } = await driveServerWipModule.backup.createDeviceWithIdentifier({ key, name });
  if (data) return { data };

  if (error?.code === 'ALREADY_EXISTS') {
    return {
      error: logger.debug({
        tag: 'BACKUPS',
        msg: 'Device name already exists',
        name,
      }),
    };
  }

  return { error: logger.error({ tag: 'BACKUPS', msg: 'Error creating device', error }) };
}
