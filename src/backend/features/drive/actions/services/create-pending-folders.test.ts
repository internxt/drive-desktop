import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { GetFolderInfoError } from '@/infra/node-win/services/get-folder-info';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';
import { call, calls, mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import * as createFolder from './create-folder';
import { createPendingFolders } from './create-pending-folders';
import * as createPendingItems from './create-pending-items';

describe('create-pending-folders', () => {
  const getFolderInfoMock = partialSpyOn(NodeWin, 'getFolderInfo');
  const createFolderMock = partialSpyOn(createFolder, 'createFolder');
  const createPendingItemsMock = partialSpyOn(createPendingItems, 'createPendingItems');

  const path = abs('/folder');

  function createProps({ folders = [{ path }], abortController = new AbortController(), isFirstExecution = false } = {}) {
    return mockProps<typeof createPendingFolders>({ ctx: { abortController }, folders, isFirstExecution });
  }

  it('should ignore if the folder is already a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    const props = createProps();
    // When
    await createPendingFolders(props);
    // Then
    calls(createFolderMock).toHaveLength(0);
  });

  it('should create folder if it is not a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('NOT_A_PLACEHOLDER') });
    const props = createProps();
    // When
    await createPendingFolders(props);
    // Then
    call(createFolderMock).toMatchObject({ path });
  });

  it('should log other errors', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ error: new GetFolderInfoError('UNKNOWN') });
    const props = createProps();
    // When
    await createPendingFolders(props);
    // Then
    call(loggerMock.error).toMatchObject({ msg: 'Error getting folder info' });
    calls(createFolderMock).toHaveLength(0);
  });

  it('should check children if it is first execution and folder is a placeholder', async () => {
    // Given
    getFolderInfoMock.mockResolvedValue({ data: { uuid: 'uuid' as FolderUuid } });
    const props = createProps({ isFirstExecution: true });
    // When
    await createPendingFolders(props);
    // Then
    call(createPendingItemsMock).toMatchObject({ parentPath: path });
  });

  it('should process every folder concurrently', async () => {
    // Given
    const folders = Array.from({ length: 5 }, (_, index) => ({ path: abs(`/folder-${index}`) }));
    const releases: Array<() => void> = [];
    let activeOperations = 0;
    let maxActiveOperations = 0;

    getFolderInfoMock.mockImplementation(async () => {
      activeOperations += 1;
      maxActiveOperations = Math.max(maxActiveOperations, activeOperations);

      await new Promise<void>((resolve) => releases.push(resolve));

      activeOperations -= 1;
      return { data: { uuid: 'uuid' as FolderUuid } };
    });

    const processing = createPendingFolders(createProps({ folders }));

    await vi.waitFor(() => expect(releases).toHaveLength(4));
    expect(maxActiveOperations).toBe(4);

    releases.splice(0).forEach((release) => release());
    await vi.waitFor(() => expect(releases).toHaveLength(1));
    releases.splice(0).forEach((release) => release());

    // When
    await processing;

    // Then
    expect(getFolderInfoMock).toHaveBeenCalledTimes(folders.length);
    expect(maxActiveOperations).toBe(4);
  });

  it('should stop taking folders when aborted', async () => {
    // Given
    const abortController = new AbortController();
    abortController.abort();

    // When
    await createPendingFolders(createProps({ abortController }));

    // Then
    calls(getFolderInfoMock).toHaveLength(0);
  });
});
