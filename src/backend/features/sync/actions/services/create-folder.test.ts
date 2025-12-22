import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolder } from './create-folder';
import { LocalSync } from '@/backend/features';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as createOrUpdateFolder from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';

describe('create-folder', () => {
  const persistMock = partialSpyOn(driveServerWip.folders, 'createFolder');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const createOrUpdateFolderMock = partialSpyOn(createOrUpdateFolder, 'createOrUpdateFolder');

  const path = abs('/parent/folder');
  let props: Parameters<typeof createFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof createFolder>({ path });
  });

  it('should add error if the file persistence fails', async () => {
    // Given
    persistMock.mockResolvedValue({ error: new Error() });
    // When
    await createFolder(props);
    // Given
    call(addItemMock).toMatchObject({ action: 'UPLOAD_ERROR', path });
  });

  it('should create the folder successfully', async () => {
    // Given
    persistMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await createFolder(props);
    // Given
    call(persistMock).toMatchObject({ path, body: { plainName: 'folder' } });
    call(addItemMock).toMatchObject({ action: 'UPLOADED', path });
    call(createOrUpdateFolderMock).toMatchObject({ folderDto: { uuid: 'uuid' } });
  });
});
