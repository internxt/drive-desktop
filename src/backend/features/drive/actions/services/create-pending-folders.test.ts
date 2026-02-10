import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { createPendingFolders } from './create-pending-folders';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as createFolder from './create-folder';
import { GetFolderInfoError } from '@/infra/node-win/services/get-folder-info';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import * as createPendingItems from './create-pending-items';

describe('create-pending-folders', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');
  const createPendingItemsMock = partialSpyOn(createPendingItems, 'createPendingItems');

  const path = abs('/folder');
  let props: Parameters<typeof createPendingFolders>[0];

  beforeEach(() => {
    props = mockProps<typeof createPendingFolders>({ folders: [{ path }] });
  });

  it('should ignore if the folder is already a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    // When
    await createPendingFolders(props);
    // Then
    calls(createFolderMock).toHaveLength(0);
  });

  it('should create folder if it is not a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    // When
    await createPendingFolders(props);
    // Then
    call(createFolderMock).toMatchObject({ path });
  });

  it('should log other errors', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('UNKNOWN') });
    // When
    await createPendingFolders(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error getting folder info' });
  });

  it('should check children if it is first execution and folder is a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    props.isFirstExecution = true;
    // When
    await createPendingFolders(props);
    // Then
    call(createPendingItemsMock).toMatchObject({ parentPath: path });
  });
});
