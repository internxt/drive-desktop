import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderNotFoundError } from '../../folders/domain/errors/FolderNotFoundError';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { ipcRendererSqlite } from '@/infra/sqlite/ipc/ipc-renderer';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { GetFolderInfoError } from '@/infra/node-win/services/item-identity/get-folder-info';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { ContentsId } from '@/apps/main/database/entities/DriveFile';
import { FileCreator } from './FileCreator';

describe('File Creator', () => {
  const contentsUploaderMock = partialSpyOn(ContentsUploader, 'run');
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const invokeMock = partialSpyOn(ipcRendererSqlite, 'invoke');

  const path = abs('/file.txt');

  const props = mockProps<typeof FileCreator.run>({ path });

  beforeEach(() => {
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'parentUuid' as FolderUuid } });
    invokeMock.mockResolvedValue({});
    contentsUploaderMock.mockResolvedValue('contentsId' as ContentsId);
  });

  it('should throw an error if placeholderId is not found', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NON_EXISTS') });
    // When
    const promise = FileCreator.run(props);
    // Then
    await expect(promise).rejects.toThrowError(FolderNotFoundError);
  });

  it('creates the file on the drive server', async () => {
    // When
    await FileCreator.run(props);
    // Then
    expect(invokeMock).toBeCalledTimes(1);
  });
});
