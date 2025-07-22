import { mockDeep } from 'vitest-mock-extended';
import * as createParentFolder from './create-folder';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from './create-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';

describe('create-file', () => {
  const fileCreationOrchestratorMock = mockDeep<FileCreationOrchestrator>();
  const createParentFolderMock = partialSpyOn(createParentFolder, 'createParentFolder');

  const path = createRelativePath('folder', 'file.txt');
  const props = mockProps<typeof createFile>({
    path,
    fileCreationOrchestrator: fileCreationOrchestratorMock,
    virtualDrive: {
      convertToPlaceholder: vi.fn(),
      updateSyncStatus: vi.fn(),
    },
  });

  it('File does not exist, create it', async () => {
    // Given
    fileCreationOrchestratorMock.run.mockResolvedValueOnce('uuid');
    // When
    await createFile(props);
    // Then
    expect(fileCreationOrchestratorMock.run).toBeCalledTimes(1);
    expect(fileCreationOrchestratorMock.run).toBeCalledWith({ path });
    expect(props.virtualDrive.convertToPlaceholder).toBeCalledTimes(1);
    expect(props.virtualDrive.convertToPlaceholder).toBeCalledWith({ itemPath: path, id: 'FILE:uuid' });
    expect(props.virtualDrive.updateSyncStatus).toBeCalledTimes(1);
    expect(props.virtualDrive.updateSyncStatus).toBeCalledWith({ itemPath: path, isDirectory: false, sync: true });
  });

  it('should run createParentFolder if parent folder does not exist', async () => {
    // Given
    fileCreationOrchestratorMock.run.mockRejectedValueOnce(new FolderNotFoundError(''));
    // When
    await createFile(props);
    // Then
    expect(fileCreationOrchestratorMock.run).toBeCalledTimes(2);
    expect(createParentFolderMock).toBeCalledTimes(1);
    expect(createParentFolderMock).toBeCalledWith({ path });
  });
});
