import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as util from '@/apps/main/util';
import { LocalSync } from '@/backend/features';
import * as createOrUpdateFolder from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolder } from './create-folder';

describe('create-folder', () => {
  const persistMock = partialSpyOn(driveServerWip.folders, 'createFolder');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const createOrUpdateFolderMock = partialSpyOn(createOrUpdateFolder, 'createOrUpdateFolder');
  const sleepMock = partialSpyOn(util, 'sleep');

  const path = abs('/parent/folder');
  let props: Parameters<typeof createFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof createFolder>({ path });
    sleepMock.mockResolvedValue();
  });

  it('should add error if the file persistence fails', async () => {
    // Given
    persistMock.mockResolvedValue({ error: new Error() });
    // When
    await createFolder(props);
    // Given
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', path },
      { action: 'UPLOAD_ERROR', path },
    ]);
  });

  it('should create the folder successfully', async () => {
    // Given
    persistMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await createFolder(props);
    // Given
    call(persistMock).toMatchObject({ context: { path, body: { plainName: 'folder' } } });
    call(createOrUpdateFolderMock).toMatchObject({ folderDto: { uuid: 'uuid' } });
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', path },
      { action: 'UPLOADED', path },
    ]);
  });

  it('should retry folder creation while its parent propagates', async () => {
    // Given
    persistMock
      .mockResolvedValueOnce({ error: { code: 'PARENT_NOT_FOUND' } })
      .mockResolvedValueOnce({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await createFolder(props);
    // Then
    calls(persistMock).toHaveLength(2);
    call(sleepMock).toBe(1_000);
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', path },
      { action: 'UPLOADED', path },
    ]);
    expect(loggerMock.debug).toHaveBeenCalledWith(
      expect.objectContaining({ msg: 'Folder created after parent folder propagation retry', path, attempts: 2 }),
    );
  });

  it('should use exponential backoff while its parent is unavailable', async () => {
    // Given
    persistMock.mockResolvedValue({ error: { code: 'PARENT_NOT_FOUND' } });
    // When
    await createFolder(props);
    // Then
    calls(persistMock).toHaveLength(4);
    calls(sleepMock).toStrictEqual([1_000, 3_000, 9_000]);
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', path },
      { action: 'UPLOAD_ERROR', path },
    ]);
  });
});
