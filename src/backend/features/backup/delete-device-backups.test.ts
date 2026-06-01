import * as addFolderToTrashModule from '../../../infra/drive-server/services/folder/services/add-folder-to-trash';
import * as getBackupFolderTreeSnapshotModule from './get-backup-folder-tree-snapshot';
import * as deleteBackupModule from './delete-backup';
import * as DeviceModuleModule from '../device/device.module';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { calls, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { deleteDeviceBackups } from './delete-device-backups';

describe('delete-device-backups', () => {
  const getBackupsFromDeviceMock = partialSpyOn(DeviceModuleModule.DeviceModule, 'getBackupsFromDevice');
  const deleteBackupMock = partialSpyOn(deleteBackupModule, 'deleteBackup');
  const getBackupFolderTreeSnapshotMock = partialSpyOn(
    getBackupFolderTreeSnapshotModule,
    'getBackupFolderTreeSnapshot',
  );
  const addFolderToTrashMock = partialSpyOn(addFolderToTrashModule, 'addFolderToTrash');

  const device = {
    id: 1,
    uuid: 'device-uuid',
    name: 'Desktop',
    bucket: 'bucket',
    removed: false,
    hasBackups: true,
  };

  it('should delete each backup and trash only stale folders from backup tree', async () => {
    const backups = [
      {
        folderUuid: 'folder-uuid-1',
        folderId: 10,
        tmpPath: '/tmp',
        backupsBucket: 'bucket',
        pathname: createAbsolutePath('/home/dev/Documents'),
        name: 'Documents',
      },
    ];

    getBackupsFromDeviceMock.mockResolvedValue(backups);
    deleteBackupMock.mockResolvedValue(undefined);
    getBackupFolderTreeSnapshotMock.mockResolvedValue({
      data: {
        tree: {
          children: [
            { id: 10, uuid: 'folder-uuid-1' },
            { id: 20, uuid: 'folder-uuid-2' },
          ],
        },
      },
    } as never);
    addFolderToTrashMock.mockResolvedValue({ data: undefined as never });

    await deleteDeviceBackups({ device, isCurrent: true });

    calls(deleteBackupMock).toStrictEqual([{ backup: backups[0], isCurrent: true }]);
    calls(addFolderToTrashMock).toStrictEqual(['folder-uuid-2']);
  });

  it('should not trash any folder when all tree children belong to backups', async () => {
    const backups = [
      {
        folderUuid: 'folder-uuid-1',
        folderId: 10,
        tmpPath: '/tmp',
        backupsBucket: 'bucket',
        pathname: createAbsolutePath('/home/dev/Documents'),
        name: 'Documents',
      },
    ];

    getBackupsFromDeviceMock.mockResolvedValue(backups);
    deleteBackupMock.mockResolvedValue(undefined);
    getBackupFolderTreeSnapshotMock.mockResolvedValue({
      data: { tree: { children: [{ id: 10, uuid: 'folder-uuid-1' }] } },
    } as never);

    await deleteDeviceBackups({ device, isCurrent: false });

    expect(addFolderToTrashMock).not.toBeCalled();
  });
});
