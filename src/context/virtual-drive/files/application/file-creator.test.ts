import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { call, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { ContentsId, FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FileCreator } from './FileCreator';
import * as getParentUuid from './get-parent-uuid';
import { Addon } from '@/node-win/addon-wrapper';

describe('FileCreator', () => {
  const convertToPlaceholderMock = partialSpyOn(Addon, 'convertToPlaceholder');
  const contentsUploaderMock = partialSpyOn(ContentsUploader, 'run');
  const getParentUuidMock = partialSpyOn(getParentUuid, 'getParentUuid');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = abs('/file.txt');
  const props = mockProps<typeof FileCreator.run>({ path });

  it('should create file', async () => {
    // Given
    contentsUploaderMock.mockResolvedValue('contentsId' as ContentsId);
    invokeMock.mockResolvedValue({ data: { uuid: 'uuid' as FileUuid } });
    getParentUuidMock.mockResolvedValue('parentUuid' as FolderUuid);
    // When
    await FileCreator.run(props);
    // Then
    call(invokeMock).toMatchObject(['persistFile', { path, parentUuid: 'parentUuid' }]);
    call(convertToPlaceholderMock).toStrictEqual({ path, placeholderId: 'FILE:uuid' });
  });
});
