import { createFolder, createParentFolder } from './create-folder';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';

describe('create-folder', () => {
  const folderCreatorMock = partialSpyOn(FolderCreator, 'run');

  const path = createRelativePath('folder1', 'folder2');
  const parentPath = '/folder1';
  const props = mockProps<typeof createFolder>({ path });

  describe('createParentFolder', () => {
    it('Calls createFolder with parent path', async () => {
      // When
      await createParentFolder(props);

      // Then
      expect(folderCreatorMock).toHaveBeenCalledTimes(1);
      expect(folderCreatorMock).toHaveBeenCalledWith({ path: parentPath });
    });
  });

  describe('createFolder', () => {
    it('Folder does not exist, create it', async () => {
      // When
      await createFolder(props);

      // Then
      expect(folderCreatorMock).toHaveBeenCalledTimes(1);
      expect(folderCreatorMock).toHaveBeenCalledWith({ path });
    });

    it('folderCreatorMock throws FolderNotFoundError', async () => {
      // Given
      folderCreatorMock.mockRejectedValueOnce(new FolderNotFoundError(''));

      // When
      await createFolder(props);

      // Then
      expect(folderCreatorMock).toHaveBeenCalledTimes(3);
      expect(folderCreatorMock).toHaveBeenCalledWith({ path });
    });
  });
});
