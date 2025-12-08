import { call, mockProps } from 'tests/vitest/utils.helper.test';
import { FolderCreator } from './FolderCreator';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { Addon } from '@/node-win/addon-wrapper';
import * as getParentUuid from '../../files/application/get-parent-uuid';

describe('FolderCreator', () => {
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = abs('/parent/folder');
  const props = mockProps<typeof FolderCreator.run>({ path });

  it('should create folder', async () => {
    // Given
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    // When
    await FolderCreator.run(props);
    // Then
    call(invokeMock).toMatchObject(['persistFolder', { path, parentUuid: 'parentUuid' }]);
    call(convertToPlaceholderMock).toStrictEqual({ path, placeholderId: 'FOLDER:uuid' });
  });
});
