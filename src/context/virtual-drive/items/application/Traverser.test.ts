import { Traverser } from './Traverser';
import { calls, mockProps, partialSpyOn } from 'tests/vitest/utils.helper.test';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import * as deleteItemPlaceholder from '@/backend/features/remote-sync/file-explorer/delete-item-placeholder';
import { FilePlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-file-placeholder';
import { FolderPlaceholderUpdater } from '@/backend/features/remote-sync/file-explorer/update-folder-placeholder';
import * as checkDangledFiles from '@/apps/sync-engine/dangled-files/check-dangled-files';
import * as loadInMemoryPaths from '@/backend/features/remote-sync/sync-items-by-checkpoint/load-in-memory-paths';

describe('Traverser', () => {
  const loadInMemoryPathsMock = partialSpyOn(loadInMemoryPaths, 'loadInMemoryPaths');
  const deleteItemPlaceholderMock = partialSpyOn(deleteItemPlaceholder, 'deleteItemPlaceholder');
  const updateFilePlaceholderMock = partialSpyOn(FilePlaceholderUpdater, 'update');
  const updateFolderPlaceholderMock = partialSpyOn(FolderPlaceholderUpdater, 'update');
  const checkDangledFilesMock = partialSpyOn(checkDangledFiles, 'checkDangledFiles');

  let props: Parameters<typeof Traverser.run>[0];

  beforeEach(() => {
    loadInMemoryPathsMock.mockResolvedValue({});

    props = mockProps<typeof Traverser.run>({
      currentFolder: { absolutePath: abs('/drive'), uuid: 'root' as FolderUuid },
      items: {
        files: [
          { parentUuid: 'root' as FolderUuid, name: 'deleted', status: 'DELETED' },
          { parentUuid: 'root' as FolderUuid, name: 'child1', status: 'EXISTS' },
          { parentUuid: 'parent1' as FolderUuid, name: 'trashed', status: 'TRASHED' },
          { parentUuid: 'parent1' as FolderUuid, name: 'child2', status: 'EXISTS' },
          { parentUuid: 'parent2' as FolderUuid, name: 'child3', status: 'EXISTS' },
        ],
        folders: [
          { parentUuid: 'root' as FolderUuid, name: 'deleted', status: 'DELETED' },
          { parentUuid: 'root' as FolderUuid, uuid: 'parent1' as FolderUuid, name: 'parent1', status: 'EXISTS' },
          { parentUuid: 'root' as FolderUuid, name: 'child1', status: 'EXISTS' },
          { parentUuid: 'parent1' as FolderUuid, uuid: 'parent2' as FolderUuid, name: 'parent2', status: 'EXISTS' },
          { parentUuid: 'parent1' as FolderUuid, name: 'trashed', status: 'TRASHED' },
          { parentUuid: 'parent1' as FolderUuid, name: 'child2', status: 'EXISTS' },
          { parentUuid: 'parent2' as FolderUuid, name: 'child3', status: 'EXISTS' },
        ],
      },
    });
  });

  it('should not include any child if first parent fails', async () => {
    // Given
    updateFolderPlaceholderMock.mockResolvedValue(false);
    // When
    await Traverser.run(props);
    // Then
    calls(checkDangledFilesMock).toHaveLength(0);
    calls(deleteItemPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/deleted' }, type: 'file' },
      { remote: { absolutePath: '/drive/deleted' }, type: 'folder' },
    ]);

    calls(updateFolderPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/parent1' } },
      { remote: { absolutePath: '/drive/child1' } },
    ]);

    calls(updateFilePlaceholderMock).toMatchObject([{ remote: { absolutePath: '/drive/child1' } }]);
  });

  it('should include some childreen if first parent succeed', async () => {
    // Given
    updateFolderPlaceholderMock.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    // When
    await Traverser.run(props);
    // Then
    calls(checkDangledFilesMock).toHaveLength(0);
    calls(deleteItemPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/deleted' }, type: 'file' },
      { remote: { absolutePath: '/drive/deleted' }, type: 'folder' },
      { remote: { absolutePath: '/drive/parent1/trashed' }, type: 'file' },
      { remote: { absolutePath: '/drive/parent1/trashed' }, type: 'folder' },
    ]);

    calls(updateFolderPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/parent1' } },
      { remote: { absolutePath: '/drive/child1' } },
      { remote: { absolutePath: '/drive/parent1/parent2' } },
      { remote: { absolutePath: '/drive/parent1/child2' } },
    ]);

    calls(updateFilePlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/child1' } },
      { remote: { absolutePath: '/drive/parent1/child2' } },
    ]);
  });

  it('should include all childreen if all parents succeed', async () => {
    // Given
    updateFolderPlaceholderMock.mockResolvedValue(true);
    // When
    await Traverser.run(props);
    // Then
    calls(checkDangledFilesMock).toHaveLength(0);
    calls(deleteItemPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/deleted' }, type: 'file' },
      { remote: { absolutePath: '/drive/deleted' }, type: 'folder' },
      { remote: { absolutePath: '/drive/parent1/trashed' }, type: 'file' },
      { remote: { absolutePath: '/drive/parent1/trashed' }, type: 'folder' },
    ]);

    calls(updateFolderPlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/parent1' } },
      { remote: { absolutePath: '/drive/child1' } },
      { remote: { absolutePath: '/drive/parent1/parent2' } },
      { remote: { absolutePath: '/drive/parent1/child2' } },
      { remote: { absolutePath: '/drive/parent1/parent2/child3' } },
    ]);

    calls(updateFilePlaceholderMock).toMatchObject([
      { remote: { absolutePath: '/drive/child1' } },
      { remote: { absolutePath: '/drive/parent1/child2' } },
      { remote: { absolutePath: '/drive/parent1/parent2/child3' } },
    ]);
  });

  it('should run dangled files if first iteration', async () => {
    // Given
    updateFolderPlaceholderMock.mockResolvedValue(true);
    props.isFirstExecution = true;
    // When
    await Traverser.run(props);
    // Then
    calls(checkDangledFilesMock).toMatchObject([
      { file: { absolutePath: '/drive/child1' } },
      { file: { absolutePath: '/drive/parent1/child2' } },
      { file: { absolutePath: '/drive/parent1/parent2/child3' } },
    ]);
  });
});
