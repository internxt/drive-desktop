import * as fetchFolderModule from '../../../infra/drive-server/services/folder/services/fetch-folder';
import * as getCredentialsModule from '../../../apps/main/auth/get-credentials';
import * as downloadModule from '../../../apps/main/network/download';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { downloadDeviceBackupZip } from './download-device-backup-zip';
import { User } from '../../../apps/main/types';

describe('download-device-backup-zip', () => {
  const fetchFolderMock = partialSpyOn(fetchFolderModule, 'fetchFolder');
  const getCredentialsMock = partialSpyOn(getCredentialsModule, 'getCredentials');
  const downloadFolderAsZipMock = partialSpyOn(downloadModule, 'downloadFolderAsZip');

  const updateProgress = vi.fn();
  const abortController = new AbortController();
  const user = { bridgeUser: 'bridge-user', userId: 'user-id' } as unknown as User;

  const device = {
    id: 1,
    uuid: 'device-uuid',
    name: 'Laptop',
    bucket: 'bucket',
    removed: false,
    hasBackups: true,
  };

  it('should return error when folder fetch fails', async () => {
    fetchFolderMock.mockResolvedValue({ error: new Error('fetch failed') } as never);

    const result = await downloadDeviceBackupZip({ user, device, path: '/tmp/backup.zip', updateProgress });

    expect(result.error?.message).toBe('Unsuccesful request to fetch folder');
  });

  it('should download backup zip with credentials and progress hooks', async () => {
    process.env.BRIDGE_URL = 'https://bridge.local';
    fetchFolderMock.mockResolvedValue({ data: { uuid: 'folder-uuid' } } as never);
    getCredentialsMock.mockReturnValue({ mnemonic: 'mnemonic' } as never);
    downloadFolderAsZipMock.mockResolvedValue(undefined as never);

    await downloadDeviceBackupZip({ user, device, path: '/tmp/backup.zip', updateProgress, abortController });

    call(downloadFolderAsZipMock).toStrictEqual([
      'Laptop',
      'https://bridge.local',
      'folder-uuid',
      '/tmp/backup.zip',
      {
        bridgeUser: 'bridge-user',
        bridgePass: 'user-id',
        encryptionKey: 'mnemonic',
      },
      {
        abortController,
        updateProgress,
      },
    ]);
  });
});
