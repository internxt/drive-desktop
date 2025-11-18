import { createFolder, createParentFolder } from './create-folder';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('create-folder', () => {
  const folderCreatorMock = partialSpyOn(FolderCreator, 'run');

  const path = abs('/parent/folder');
  const props = mockProps<typeof createFolder>({ path });

  describe('createParentFolder', () => {
    it('Calls createFolder with parent path', async () => {
      // When
      await createParentFolder(props);
      // Then
      call(folderCreatorMock).toMatchObject({ path: '/parent' });
    });
  });

  describe('createFolder', () => {
    it('Folder does not exist, create it', async () => {
      // When
      await createFolder(props);
      // Then
      call(folderCreatorMock).toMatchObject({ path });
    });

    it('folderCreatorMock throws FolderNotFoundError', async () => {
      // Given
      folderCreatorMock.mockRejectedValueOnce(new FolderNotFoundError(''));
      // When
      await createFolder(props);
      // Then
      calls(folderCreatorMock).toMatchObject([{ path }, { path: '/parent' }, { path }]);
    });
  });
});
