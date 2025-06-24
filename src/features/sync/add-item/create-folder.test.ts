import { mockDeep } from 'vitest-mock-extended';
import { createFolder, createParentFolder } from './create-folder';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';

describe('create-folder', () => {
  const folderCreator = mockDeep<FolderCreator>();

  const path = '/folder1/folder2';
  const parentPath = '/folder1';
  const props = { posixRelativePath: path, folderCreator };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createParentFolder', () => {
    it('Calls createFolder with parent path', async () => {
      // When
      await createParentFolder(props);

      // Then
      expect(folderCreator.run).toHaveBeenCalledTimes(1);
      expect(folderCreator.run).toHaveBeenCalledWith({ path: parentPath });
    });
  });

  describe('createFolder', () => {
    it('Folder does not exist, create it', async () => {
      // When
      await createFolder(props);

      // Then
      expect(folderCreator.run).toHaveBeenCalledTimes(1);
      expect(folderCreator.run).toHaveBeenCalledWith({ path });
    });

    it('folderCreator.run throws FolderNotFoundError', async () => {
      // Given
      folderCreator.run.mockImplementationOnce(() => {
        throw new FolderNotFoundError('Error creating folder');
      });

      // When
      await createFolder(props);

      // Then
      expect(folderCreator.run).toHaveBeenCalledTimes(3);
      expect(folderCreator.run).toHaveBeenCalledWith({ path });
    });
  });
});
