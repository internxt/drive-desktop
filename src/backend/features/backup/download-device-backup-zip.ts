import { PathLike } from 'node:fs';
import type { Device } from './types/Device';
import { User } from '../../../apps/main/types';
import { fetchFolder } from '../../../infra/drive-server/services/folder/services/fetch-folder';
import { getCredentials } from '../../../apps/main/auth/get-credentials';
import { downloadFolderAsZip } from '../../../apps/main/network/download';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Result } from '../../../context/shared/domain/Result';

type Props = {
  user: User;
  device: Device;
  path: PathLike;
  updateProgress: (progress: number) => void;
  abortController?: AbortController;
};

export async function downloadDeviceBackupZip({
  user,
  device,
  path,
  updateProgress,
  abortController,
}: Props): Promise<Result<boolean, Error>> {
  const { data: folder, error } = await fetchFolder(device.uuid);
  if (error) {
    logger.error({ tag: 'BACKUPS', msg: 'Unsuccesful request to fetch folder', error });
    return { error: new Error('Unsuccesful request to fetch folder') };
  }

  if (!folder || folder.uuid.length === 0) {
    logger.error({ tag: 'BACKUPS', msg: 'No backup data found' });
    return { error: new Error('No backup data found') };
  }

  const networkApiUrl = process.env.BRIDGE_URL;
  const bridgeUser = user.bridgeUser;
  const bridgePass = user.userId;
  const { mnemonic } = getCredentials();

  await downloadFolderAsZip(
    device.name,
    networkApiUrl,
    folder.uuid,
    path,
    {
      bridgeUser,
      bridgePass,
      encryptionKey: mnemonic,
    },
    {
      abortController,
      updateProgress,
    },
  );

  return { data: true };
}
