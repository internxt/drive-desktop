import { mockProps } from '@/tests/vitest/utils.helper.test';
import { updateFileStatuses } from './update-file-statuses';
import { updateFolderStatuses } from './update-folder-statuses';
import { syncItemsByFolder } from './sync-items-by-folder';
import { sleep } from '@/apps/main/util';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

vi.mock(import('@/apps/main/util'));
vi.mock(import('./update-file-statuses'));
vi.mock(import('./update-folder-statuses'));

describe('sync-items-by-folder', () => {
  const updateFolderStatusesMock = vi.mocked(updateFolderStatuses);
  const updateFileStatusesMock = vi.mocked(updateFileStatuses);
  const sleepMock = vi.mocked(sleep);

  let props: Parameters<typeof syncItemsByFolder>[0];

  beforeEach(() => {
    props = mockProps<typeof syncItemsByFolder>({
      rootFolderUuid: 'rootFolderUuid',
      context: {
        abortController: new AbortController(),
        workspaceId: '',
        workspaceToken: '',
      },
    });
  });

  it('should not iterate if signal is aborted', async () => {
    // Given
    props.context.abortController.abort();
    // When
    await syncItemsByFolder(props);
    // Then
    expect(updateFolderStatusesMock).toBeCalledTimes(0);
    expect(updateFileStatusesMock).toBeCalledTimes(0);
    expect(sleepMock).toBeCalledTimes(0);
  });

  it('should not iterate again if signal is aborted', async () => {
    // Given
    updateFolderStatusesMock.mockImplementation(() => {
      props.context.abortController.abort();
      return Promise.resolve(['folderUuid' as FolderUuid]);
    });
    // When
    await syncItemsByFolder(props);
    // Then
    expect(updateFolderStatusesMock).toBeCalledTimes(1);
    expect(updateFileStatusesMock).toBeCalledTimes(1);
    expect(sleepMock).toBeCalledTimes(1);
  });

  it('should not iterate another time if there are no folders inside', async () => {
    // Given
    updateFolderStatusesMock.mockResolvedValue([]);
    // When
    await syncItemsByFolder(props);
    // Then
    expect(updateFolderStatusesMock).toBeCalledTimes(1);
    expect(updateFileStatusesMock).toBeCalledTimes(1);
    expect(sleepMock).toBeCalledTimes(1);
  });

  it('should iterate another time if there are folders inside', async () => {
    // Given
    updateFolderStatusesMock.mockResolvedValueOnce(['folderUuid' as FolderUuid]);
    updateFolderStatusesMock.mockResolvedValueOnce([]);
    // When
    await syncItemsByFolder(props);
    // Then
    expect(updateFolderStatusesMock).toBeCalledTimes(2);
    expect(updateFileStatusesMock).toBeCalledTimes(2);
    expect(sleepMock).toBeCalledTimes(2);
    expect(updateFolderStatusesMock).toHaveBeenCalledWith({ context: props.context, folderUuid: 'rootFolderUuid' });
    expect(updateFolderStatusesMock).toHaveBeenCalledWith({ context: props.context, folderUuid: 'folderUuid' });
    expect(updateFileStatusesMock).toHaveBeenCalledWith({ context: props.context, folderUuid: 'rootFolderUuid' });
    expect(updateFileStatusesMock).toHaveBeenCalledWith({ context: props.context, folderUuid: 'folderUuid' });
  });
});
