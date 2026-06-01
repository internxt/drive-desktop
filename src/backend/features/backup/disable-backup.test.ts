import * as findBackupPathnameFromIdModule from './find-backup-pathname-from-id';
import * as getBackupFolderTreeSnapshotModule from './get-backup-folder-tree-snapshot';
import * as deleteBackupModule from './delete-backup';
import configStoreModule from '../../../apps/main/config';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { loggerMock } from '../../../../tests/vitest/mocks.helper';
import { disableBackup } from './disable-backup';

describe('disable-backup', () => {
  const findBackupPathnameFromIdMock = partialSpyOn(findBackupPathnameFromIdModule, 'findBackupPathnameFromId');
  const getBackupFolderTreeSnapshotMock = partialSpyOn(
    getBackupFolderTreeSnapshotModule,
    'getBackupFolderTreeSnapshot',
  );
  const deleteBackupMock = partialSpyOn(deleteBackupModule, 'deleteBackup');
  const configStoreGetMock = partialSpyOn(configStoreModule, 'get');
  const configStoreSetMock = partialSpyOn(configStoreModule, 'set');

  const backup = {
    folderUuid: 'folder-uuid',
    folderId: 1,
    tmpPath: '/tmp',
    backupsBucket: 'bucket',
    pathname: createAbsolutePath('/home/dev/Documents'),
    name: 'Documents',
  };

  it('should throw when backup pathname is not found', async () => {
    configStoreGetMock.mockReturnValue({});
    findBackupPathnameFromIdMock.mockReturnValue(undefined);

    await expect(disableBackup({ backup })).rejects.toBeUndefined();

    expect(configStoreSetMock).not.toBeCalled();
    expect(getBackupFolderTreeSnapshotMock).not.toBeCalled();
  });

  it('should disable backup and delete it when tree size is zero', async () => {
    const backupList = {
      '/home/dev/Documents': { folderId: 1, folderUuid: 'folder-uuid', enabled: true },
    };

    configStoreGetMock.mockReturnValue(backupList);
    findBackupPathnameFromIdMock.mockReturnValue('/home/dev/Documents');
    getBackupFolderTreeSnapshotMock.mockResolvedValue({ data: { size: 0 } } as never);
    deleteBackupMock.mockResolvedValue({ data: true });

    await disableBackup({ backup });

    call(configStoreSetMock).toStrictEqual([
      'backupList',
      {
        '/home/dev/Documents': { folderId: 1, folderUuid: 'folder-uuid', enabled: false },
      },
    ]);
    call(deleteBackupMock).toStrictEqual({ backup, isCurrent: true });
  });

  it('should log error when fetching the backup folder tree snapshot fails', async () => {
    const error = new Error('snapshot failed');
    configStoreGetMock.mockReturnValue({
      '/home/dev/Documents': { folderId: 1, folderUuid: 'folder-uuid', enabled: true },
    });
    findBackupPathnameFromIdMock.mockReturnValue('/home/dev/Documents');
    getBackupFolderTreeSnapshotMock.mockResolvedValue({ error } as never);

    await expect(disableBackup({ backup })).rejects.toBeUndefined();

    call(loggerMock.error).toMatchObject({
      tag: 'BACKUPS',
      msg: 'Error fetching backup folder tree snapshot',
    });
  });
});
