import { mockDeep } from 'vitest-mock-extended';
import { AddController } from './AddController';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import { FolderCreator } from '@/context/virtual-drive/folders/application/FolderCreator';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as createFile from '@/features/sync/add-item/create-file';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';

describe('add-controller', () => {
  const createFileMock = partialSpyOn(createFile, 'createFile');
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');
  const fileCreationOrchestrator = mockDeep<FileCreationOrchestrator>();
  const folderCreator = mockDeep<FolderCreator>();
  const addController = new AddController(fileCreationOrchestrator, folderCreator);

  describe('createFile', () => {
    let props: Parameters<typeof addController.createFile>[0];

    beforeEach(() => {
      vi.clearAllMocks();
      props = mockProps<typeof addController.createFile>({});
    });

    it('should not call add controller if the file is empty', async () => {
      // Given
      props.size = 0;
      // When
      await addController.createFile(props);
      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should not call add controller if the file is larger than MAX_SIZE', async () => {
      // Given
      props.size = BucketEntry.MAX_SIZE + 1;

      // When
      await addController.createFile(props);

      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should not call add controller if the file is temporary', async () => {
      // Given
      isTemporaryFileMock.mockReturnValueOnce(true);

      // When
      await addController.createFile(props);

      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should call add controller if the file is not temporary', async () => {
      // Given
      isTemporaryFileMock.mockReturnValueOnce(false);

      // When
      await addController.createFile(props);

      // Then
      expect(createFileMock).toHaveBeenCalled();
    });
  });
});
