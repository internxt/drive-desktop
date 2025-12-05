import { AddController } from './add-controller';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as isTemporaryFile from '@/apps/utils/isTemporalFile';
import { SyncModule } from '@internxt/drive-desktop-core/build/backend';
import { FileCreator } from '@/context/virtual-drive/files/application/FileCreator';

describe('add-controller', () => {
  const createFileMock = partialSpyOn(FileCreator, 'run');
  const isTemporaryFileMock = partialSpyOn(isTemporaryFile, 'isTemporaryFile');

  describe('createFile', () => {
    let props: Parameters<typeof AddController.createFile>[0];

    beforeEach(() => {
      props = mockProps<typeof AddController.createFile>({ stats: { size: 1024 } });
    });

    it('should not call add controller if the file is empty', async () => {
      // Given
      props.stats.size = 0;
      // When
      await AddController.createFile(props);
      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should not call add controller if the file is larger than MAX_SIZE', async () => {
      // Given
      props.stats.size = SyncModule.MAX_FILE_SIZE + 1;
      // When
      await AddController.createFile(props);
      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should not call add controller if the file is temporary', async () => {
      // Given
      isTemporaryFileMock.mockReturnValueOnce(true);
      // When
      await AddController.createFile(props);
      // Then
      expect(createFileMock).not.toHaveBeenCalled();
    });

    it('should call add controller if the file is not temporary', async () => {
      // Given
      isTemporaryFileMock.mockReturnValueOnce(false);
      // When
      await AddController.createFile(props);
      // Then
      expect(createFileMock).toHaveBeenCalled();
    });
  });
});
