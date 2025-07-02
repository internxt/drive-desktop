import { mockDeep } from 'vitest-mock-extended';
import { createParentFolder } from './create-folder';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from './create-file';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';

vi.mock(import('./create-folder'));

describe('create-file', () => {
  const fileCreationOrchestratorMock = mockDeep<FileCreationOrchestrator>();
  const createParentFolderMock = vi.mocked(createParentFolder);

  const path = createRelativePath('folder1', 'folder2');
  const props = mockProps<typeof createFile>({
    path,
    fileCreationOrchestrator: fileCreationOrchestratorMock,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('File does not exist, create it', async () => {
    // When
    await createFile(props);

    // Then
    expect(fileCreationOrchestratorMock.run).toHaveBeenCalledTimes(1);
    expect(fileCreationOrchestratorMock.run).toHaveBeenCalledWith({ path });
  });

  it('should run createParentFolder if parent folder does not exist', async () => {
    // Given
    fileCreationOrchestratorMock.run.mockRejectedValueOnce(new FolderNotFoundError(''));

    // When
    await createFile(props);

    // Then
    expect(createParentFolderMock).toHaveBeenCalledTimes(1);
    expect(createParentFolderMock).toHaveBeenCalledWith({ path });
  });
});
