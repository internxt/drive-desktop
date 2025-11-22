import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { downloadBackup } from './download-backup';
import * as getUserOrThrow from '@/apps/main/auth/service';
import * as getPathFromDialog from '@/apps/main/device/service';
import * as downloadFolder from './download-folder';
import { ipcMain } from 'electron';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

describe('download-backup', () => {
  const getUserOrThrowMock = partialSpyOn(getUserOrThrow, 'getUserOrThrow');
  const getPathFromDialogMock = partialSpyOn(getPathFromDialog, 'getPathFromDialog');
  const downloadFolderMock = partialSpyOn(downloadFolder, 'downloadFolder');
  const onMock = partialSpyOn(ipcMain, 'on');
  const removeListenerMock = vi.spyOn(ipcMain, 'removeListener');

  const props = mockProps<typeof downloadBackup>({
    device: {
      name: 'device',
      uuid: 'deviceUuid',
    },
  });

  beforeEach(() => {
    getUserOrThrowMock.mockReturnValue({});
    getPathFromDialogMock.mockResolvedValue({ path: '/backup' });
  });

  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('should stop if the user does not select a path', async () => {
    // Given
    getPathFromDialogMock.mockResolvedValue(null);
    // When
    await downloadBackup(props);
    // Then
    calls(downloadFolderMock).toHaveLength(0);
  });

  it('should set listeners', async () => {
    // When
    await downloadBackup(props);
    // Then
    call(onMock).toStrictEqual(['abort-download-backups-deviceUuid', expect.any(Function)]);
    call(removeListenerMock).toStrictEqual(['abort-download-backups-deviceUuid', expect.any(Function)]);
  });

  it('should use deviceUuid as rootUuids if no folderUuids are provided', async () => {
    // When
    await downloadBackup(props);
    // Then
    call(downloadFolderMock).toMatchObject({
      device: { name: 'device', uuid: 'deviceUuid' },
      rootPath: '/backup/Backup_20250101120000',
      rootUuid: 'deviceUuid',
    });
  });

  it('should use folderUuids as rootUuids if are provided', async () => {
    // Given
    props.folderUuids = ['folderUuid' as FolderUuid];
    // When
    await downloadBackup(props);
    // Then
    call(downloadFolderMock).toMatchObject({
      device: { name: 'device', uuid: 'deviceUuid' },
      rootPath: '/backup/Backup_20250101120000',
      rootUuid: 'folderUuid',
    });
  });
});
