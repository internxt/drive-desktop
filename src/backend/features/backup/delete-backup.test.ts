import * as addFolderToTrashModule from '../../../infra/drive-server/services/folder/services/add-folder-to-trash';
import configStoreModule from '../../../apps/main/config';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { DriveServerError } from '../../../infra/drive-server/drive-server.error';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { deleteBackup } from './delete-backup';

describe('delete-backup', () => {
  const addFolderToTrashMock = partialSpyOn(addFolderToTrashModule, 'addFolderToTrash');
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

  it('should return an error when request to trash folder fails', async () => {
    addFolderToTrashMock.mockResolvedValue({ error: new DriveServerError('UNKNOWN', undefined, 'request failed') });

    const result = await deleteBackup({ backup });

    expect(result).toMatchObject({ error: { message: 'Request to delete backup wasnt succesful' } });
  });

  it('should not update backup list when isCurrent is false', async () => {
    addFolderToTrashMock.mockResolvedValue({ data: undefined as never });

    await deleteBackup({ backup, isCurrent: false });

    call(addFolderToTrashMock).toBe('folder-uuid');
    expect(configStoreGetMock).not.toBeCalled();
    expect(configStoreSetMock).not.toBeCalled();
  });

  it('should remove backup from local list when isCurrent is true', async () => {
    addFolderToTrashMock.mockResolvedValue({ data: undefined as never });
    configStoreGetMock.mockReturnValue({
      '/home/dev/Documents': backup,
      '/home/dev/Pictures': {
        ...backup,
        folderId: 2,
        folderUuid: 'folder-uuid-2',
        pathname: createAbsolutePath('/home/dev/Pictures'),
        name: 'Pictures',
      },
    } as never);

    await deleteBackup({ backup, isCurrent: true });

    call(configStoreSetMock).toStrictEqual([
      'backupList',
      {
        '/home/dev/Pictures': {
          ...backup,
          folderId: 2,
          folderUuid: 'folder-uuid-2',
          pathname: createAbsolutePath('/home/dev/Pictures'),
          name: 'Pictures',
        },
      },
    ]);
  });
});
