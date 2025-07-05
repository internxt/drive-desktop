import { mockDeep } from 'vitest-mock-extended';
import { FetchDataService } from './fetchData.service';
import { BindingsManager } from '../BindingManager';
import { FilePlaceholderId } from '../../../context/virtual-drive/files/domain/PlaceholderId';
import { File } from '../../../context/virtual-drive/files/domain/File';
import { DeepPartial } from 'ts-essentials';
import { it } from 'vitest';
import { unlink } from 'fs/promises';

vi.mock('fs/promises');

const fetchData = new FetchDataService();

describe('Fetch Data', () => {
  const self = mockDeep<BindingsManager>();

  const file: DeepPartial<File> = { path: 'path' };
  const filePlaceholderId: FilePlaceholderId = 'FILE:1';

  beforeEach(() => {
    vi.clearAllMocks();

    self.controllers.downloadFile.execute.mockResolvedValue('path');
    self.controllers.downloadFile.fileFinderByUuid.mockReturnValue(file as File);
  });

  describe('When progress value is wrong', () => {
    it('When progress is greater than 1, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: false, progress: 2 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });

    it('When progress is less than 0, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: false, progress: -1 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });

    it('When finished but progress is 0, then throw an error', async () => {
      // Arrange
      const callback = async () => await Promise.resolve({ finished: true, progress: 0 });

      // Act
      await fetchData.run({ self, filePlaceholderId, callback });

      // Arrange
      expect(unlink).toHaveBeenCalledWith('path');
    });
  });
});
