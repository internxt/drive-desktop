import { mockDeep } from 'vitest-mock-extended';
import * as createParentFolder from './create-folder';
import { FolderNotFoundError } from '@/context/virtual-drive/folders/domain/errors/FolderNotFoundError';
import { createRelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { createFile } from './create-file';
import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { FileCreationOrchestrator } from '@/context/virtual-drive/boundaryBridge/application/FileCreationOrchestrator';
import VirtualDrive from '@/node-win/virtual-drive';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';

describe('create-file', () => {
  const virtualDrive = mockDeep<VirtualDrive>();

  const fileCreationOrchestratorMock = mockDeep<FileCreationOrchestrator>();
  const createParentFolderMock = partialSpyOn(createParentFolder, 'createParentFolder');

  const path = createRelativePath('folder', 'file.txt');
  const props = mockProps<typeof createFile>({
    ctx: { virtualDrive },
    path,
    fileCreationOrchestrator: fileCreationOrchestratorMock,
  });

  it('File does not exist, create it', async () => {
    // Given
    fileCreationOrchestratorMock.run.mockResolvedValueOnce('uuid' as FileUuid);
    // When
    await createFile(props);
    // Then
    expect(fileCreationOrchestratorMock.run).toBeCalledTimes(1);
    expect(fileCreationOrchestratorMock.run).toBeCalledWith(expect.objectContaining({ path }));
    expect(virtualDrive.convertToPlaceholder).toBeCalledTimes(1);
    expect(virtualDrive.convertToPlaceholder).toBeCalledWith({ itemPath: path, id: 'FILE:uuid' });
    expect(virtualDrive.updateSyncStatus).toBeCalledTimes(1);
    expect(virtualDrive.updateSyncStatus).toBeCalledWith({ itemPath: path, isDirectory: false, sync: true });
  });

  it('should run createParentFolder if parent folder does not exist', async () => {
    // Given
    fileCreationOrchestratorMock.run.mockRejectedValueOnce(new FolderNotFoundError(''));
    // When
    await createFile(props);
    // Then
    expect(fileCreationOrchestratorMock.run).toBeCalledTimes(2);
    expect(createParentFolderMock).toBeCalledTimes(1);
    expect(createParentFolderMock).toBeCalledWith(expect.objectContaining({ path }));
  });
});
