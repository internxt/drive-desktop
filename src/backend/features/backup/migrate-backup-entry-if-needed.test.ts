import configStoreModule from '../../../apps/main/config';
import * as getBackupFolderUuidModule from '../../../infra/drive-server/services/folder/services/fetch-backup-folder-uuid';
import { logger } from '@internxt/drive-desktop-core/build/backend/core/logger/logger';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { migrateBackupEntryIfNeeded } from './migrate-backup-entry-if-needed';

describe('migrate-backup-entry-if-needed', () => {
  const getBackupFolderUuidMock = partialSpyOn(getBackupFolderUuidModule, 'getBackupFolderUuid');
  const configStoreGetMock = partialSpyOn(configStoreModule, 'get');
  const configStoreSetMock = partialSpyOn(configStoreModule, 'set');
  const loggerErrorMock = partialSpyOn(logger, 'error');

  it('should migrate backup by fetching folder uuid and persisting it', async () => {
    const pathname = '/home/dev/Documents';
    const backup = { folderId: 1, folderUuid: '', enabled: true };
    const backupList = { [pathname]: backup };

    getBackupFolderUuidMock.mockResolvedValue({ data: 'new-folder-uuid' });
    configStoreGetMock.mockReturnValue(backupList);

    const result = await migrateBackupEntryIfNeeded({ pathname, backup });

    expect(result.data?.folderUuid).toBe('new-folder-uuid');
    call(configStoreSetMock).toStrictEqual(['backupList', backupList]);
  });

  it('should return error when folder uuid retrieval fails', async () => {
    const error = new Error('uuid request failed');
    const backup = { folderId: 1, folderUuid: '', enabled: true };

    getBackupFolderUuidMock.mockResolvedValue({ error } as never);

    const result = await migrateBackupEntryIfNeeded({ pathname: '/home/dev/Documents', backup });

    expect(result.error?.message).toBe(error.message);
    expect(loggerErrorMock).toBeCalled();
  });
});
