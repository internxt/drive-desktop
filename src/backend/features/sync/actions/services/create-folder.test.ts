import { FileSystemModule } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { LocalSync } from '@/backend/features';
import * as createOrUpdateFolder from '@/backend/features/remote-sync/update-in-sqlite/create-or-update-folder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createFolder } from './create-folder';

describe('create-folder', () => {
  const statMock = partialSpyOn(FileSystemModule, 'statThrow');
  const persistMock = partialSpyOn(driveServerWip.folders, 'createFolder');
  const addItemMock = partialSpyOn(LocalSync.SyncState, 'addItem');
  const createOrUpdateFolderMock = partialSpyOn(createOrUpdateFolder, 'createOrUpdateFolder');

  const path = abs('/parent/folder');
  const mtime = new Date('2000-01-01T00:00:00.000Z');
  const birthtime = new Date('1999-01-01T00:00:00.000Z');
  let props: Parameters<typeof createFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof createFolder>({ path });
    statMock.mockResolvedValue({ mtime, birthtime } as Stats);
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
    call(persistMock).toMatchObject({
      context: {
        path,
        body: {
          plainName: 'folder',
          modificationTime: '2000-01-01T00:00:00.000Z',
          creationTime: '1999-01-01T00:00:00.000Z',
        },
      },
    });
    call(createOrUpdateFolderMock).toMatchObject({ folderDto: { uuid: 'uuid' } });
    calls(addItemMock).toMatchObject([
      { action: 'UPLOADING', path },
      { action: 'UPLOADED', path },
    ]);
  });
});
