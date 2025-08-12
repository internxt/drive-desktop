import { mockDeep } from 'vitest-mock-extended';
import { BindingsManager } from '../binding-manager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { DeepPartial } from 'ts-essentials';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { unlink } from 'fs/promises';
import { fetchData } from './fetchData.service';

vi.mock(import('fs/promises'));

describe('Fetch Data', () => {
  const self = mockDeep<BindingsManager>();

  const file: DeepPartial<SimpleDriveFile> = { nameWithExtension: 'file.txt' };
  const filePlaceholderId: FilePlaceholderId = 'FILE:1';

  beforeEach(() => {
    self.controllers.downloadFile.execute.mockResolvedValue('path');
    self.controllers.downloadFile.fileFinderByUuid.mockResolvedValue(file as SimpleDriveFile);
  });

  describe('When progress value is wrong', () => {
    it('When progress is greater than 1, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: false, progress: 2 });

      // Act
      await fetchData({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });

    it('When progress is less than 0, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: false, progress: -1 });

      // Act
      await fetchData({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });

    it('When finished but progress is 0, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: true, progress: 0 });

      // Act
      await fetchData({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });
  });
});
