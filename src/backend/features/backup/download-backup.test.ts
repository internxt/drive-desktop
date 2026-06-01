import path from 'node:path';
import { rm } from 'node:fs/promises';
import { ipcMain } from 'electron';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { loggerMock } from '../../../../tests/vitest/mocks.helper';
import * as windowsModule from '../../../apps/main/windows';
import * as downloadDeviceBackupZipModule from './download-device-backup-zip';
import * as authServiceModule from '../../../apps/main/auth/service';
import { downloadBackup } from './download-backup';

vi.mock('node:fs/promises', () => ({
  rm: vi.fn(),
}));

describe('download-backup', () => {
  const broadcastToWindowsMock = partialSpyOn(windowsModule, 'broadcastToWindows');
  const downloadDeviceBackupZipMock = partialSpyOn(downloadDeviceBackupZipModule, 'downloadDeviceBackupZip');
  const getUserMock = partialSpyOn(authServiceModule, 'getUser');

  const ipcMainOnMock = vi.mocked(ipcMain.on);
  const rmMock = vi.mocked(rm);

  const user = { bridgeUser: 'bridge-user', userId: 'user-id' };

  const device = {
    id: 1,
    uuid: 'device-uuid',
    name: 'Desktop',
    bucket: 'bucket',
    removed: false,
    hasBackups: true,
  };

  const pathname = createAbsolutePath('/home/dev/Downloads');

  let removeListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 3, 21, 9, 8, 7));

    removeListenerMock = vi.fn();
    ipcMainOnMock.mockReturnValue({ removeListener: removeListenerMock } as never);
    rmMock.mockResolvedValue(undefined as never);
    getUserMock.mockReturnValue(user as never);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should download backup and broadcast progress when not aborted', async () => {
    downloadDeviceBackupZipMock.mockImplementation(async ({ updateProgress }) => {
      updateProgress(33);
    });

    await downloadBackup({ device, pathname });

    call(loggerMock.debug).toMatchObject({
      tag: 'BACKUPS',
      msg: '[BACKUPS] Downloading Device',
      deviceName: device.name,
      pathname,
    });

    call(downloadDeviceBackupZipMock).toMatchObject({
      device,
      path: path.join(pathname, 'Backup_2026421987.zip'),
    });

    call(broadcastToWindowsMock).toStrictEqual([
      'backup-download-progress',
      {
        id: device.uuid,
        progress: 33,
      },
    ]);

    expect(rmMock).not.toHaveBeenCalled();
    expect(removeListenerMock).toHaveBeenCalledWith('abort-download-backups-' + device.uuid, expect.any(Function));
  });

  it('should skip broadcasting progress when aborted for the same device', async () => {
    downloadDeviceBackupZipMock.mockImplementation(async ({ updateProgress }) => {
      const abortListener = ipcMainOnMock.mock.calls[0]?.[1];
      abortListener?.({} as never, device.uuid);
      updateProgress(90);
    });

    await downloadBackup({ device, pathname });

    expect(broadcastToWindowsMock).not.toHaveBeenCalled();
  });

  it('should keep broadcasting when abort event is for another device', async () => {
    downloadDeviceBackupZipMock.mockImplementation(async ({ updateProgress }) => {
      const abortListener = ipcMainOnMock.mock.calls[0]?.[1];
      abortListener?.({} as never, 'other-device-uuid');
      updateProgress(12);
    });

    await downloadBackup({ device, pathname });

    call(broadcastToWindowsMock).toStrictEqual([
      'backup-download-progress',
      {
        id: device.uuid,
        progress: 12,
      },
    ]);
  });

  it('should remove generated zip file when download fails', async () => {
    downloadDeviceBackupZipMock.mockRejectedValue(new Error('download failed'));

    await downloadBackup({ device, pathname });

    call(rmMock).toStrictEqual([path.join(pathname, 'Backup_2026421987.zip'), { force: true }]);
    expect(removeListenerMock).toHaveBeenCalledWith('abort-download-backups-' + device.uuid, expect.any(Function));
  });
});
